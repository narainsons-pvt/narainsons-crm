const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const pool = require("../db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { validateCustomer } = require("../utils/validation");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

function normalizeRow(row, mapping) {
  return {
    pan_number: row[mapping.pan_number],
    customer_name: row[mapping.customer_name],
    mobile_number: row[mapping.mobile_number],
    email: mapping.email ? row[mapping.email] : null,
    address: mapping.address ? row[mapping.address] : null,
    raw_data: row
  };
}

function readExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === ".csv") {
    return await readCsv(filePath);
  }

  if (ext === ".xlsx" || ext === ".xls") {
    return readExcel(filePath);
  }

  throw new Error("Only CSV, XLS, and XLSX files are allowed");
}

router.post("/columns", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const rows = await parseFile(req.file.path, req.file.originalname);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    res.json({
      file_name: req.file.filename,
      original_name: req.file.originalname,
      columns,
      sample_rows: rows.slice(0, 5)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/import", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { file_name, original_name, branch_id, mapping, template_name } = req.body;

    if (!file_name || !branch_id || !mapping) {
      return res.status(400).json({ message: "File, branch, and mapping are required" });
    }

    const filePath = path.join("uploads", file_name);
    const rows = await parseFile(filePath, original_name || file_name);

    await client.query("BEGIN");

    const uploadResult = await client.query(
      `INSERT INTO csv_uploads 
       (branch_id, uploaded_by, file_name, total_records)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [branch_id, req.user.id, original_name || file_name, rows.length]
    );

    const uploadId = uploadResult.rows[0].id;

    if (template_name) {
      await client.query(
        `INSERT INTO field_mapping (user_id, template_name, mapping)
         VALUES ($1, $2, $3)`,
        [req.user.id, template_name, mapping]
      );
    }

    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    const seenPAN = new Set();

    for (let i = 0; i < rows.length; i++) {
      const normalized = normalizeRow(rows[i], mapping);

      normalized.pan_number = normalized.pan_number
        ? String(normalized.pan_number).trim().toUpperCase()
        : "";

      normalized.mobile_number = normalized.mobile_number
        ? String(normalized.mobile_number).trim()
        : "";

      const errors = validateCustomer(normalized);

      if (seenPAN.has(normalized.pan_number)) {
        duplicateCount++;

        await client.query(
          `INSERT INTO duplicate_records (upload_id, pan_number, row_data)
           VALUES ($1, $2, $3)`,
          [uploadId, normalized.pan_number, rows[i]]
        );

        continue;
      }

      seenPAN.add(normalized.pan_number);

      const existingPAN = await client.query(
        "SELECT id FROM customers WHERE pan_number = $1",
        [normalized.pan_number]
      );

      if (existingPAN.rows.length > 0) {
        duplicateCount++;

        await client.query(
          `INSERT INTO duplicate_records (upload_id, pan_number, row_data)
           VALUES ($1, $2, $3)`,
          [uploadId, normalized.pan_number, rows[i]]
        );

        continue;
      }

      if (errors.length > 0) {
        invalidCount++;

        await client.query(
          `INSERT INTO validation_errors 
           (upload_id, row_number, pan_number, error_type, error_message, row_data)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            uploadId,
            i + 1,
            normalized.pan_number,
            "Validation Error",
            errors.join(", "),
            rows[i]
          ]
        );

        continue;
      }

      await client.query(
        `INSERT INTO customers 
         (branch_id, pan_number, customer_name, mobile_number, email, address, upload_id, raw_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          branch_id,
          normalized.pan_number,
          normalized.customer_name,
          normalized.mobile_number,
          normalized.email,
          normalized.address,
          uploadId,
          normalized.raw_data
        ]
      );

      validCount++;
    }

    await client.query(
      `UPDATE csv_uploads
       SET valid_records = $1,
           invalid_records = $2,
           duplicate_records = $3
       WHERE id = $4`,
      [validCount, invalidCount, duplicateCount, uploadId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Import completed",
      upload_id: uploadId,
      total_records: rows.length,
      valid_records: validCount,
      invalid_records: invalidCount,
      duplicate_records: duplicateCount
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  const result = await pool.query(
    `SELECT csv_uploads.*, branches.name AS branch_name, users.name AS uploaded_by_name
     FROM csv_uploads
     LEFT JOIN branches ON csv_uploads.branch_id = branches.id
     LEFT JOIN users ON csv_uploads.uploaded_by = users.id
     ORDER BY uploaded_at DESC`
  );

  res.json(result.rows);
});

module.exports = router;