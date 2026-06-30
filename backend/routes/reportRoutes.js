const express = require("express");
const pool = require("../db");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", authMiddleware, async (req, res) => {
  const totalRecords = await pool.query("SELECT COUNT(*) FROM customers");
  const invalidRecords = await pool.query("SELECT COUNT(*) FROM validation_errors");
  const duplicateRecords = await pool.query("SELECT COUNT(*) FROM duplicate_records");
  const todayUploads = await pool.query(
    "SELECT COUNT(*) FROM csv_uploads WHERE uploaded_at::date = CURRENT_DATE"
  );

  const branchStats = await pool.query(
    `SELECT branches.name, COUNT(customers.id) AS total
     FROM branches
     LEFT JOIN customers ON customers.branch_id = branches.id
     GROUP BY branches.name
     ORDER BY branches.name`
  );

  res.json({
    total_records: Number(totalRecords.rows[0].count),
    invalid_records: Number(invalidRecords.rows[0].count),
    duplicate_records: Number(duplicateRecords.rows[0].count),
    today_uploads: Number(todayUploads.rows[0].count),
    branch_statistics: branchStats.rows
  });
});

router.get("/uploads", authMiddleware, async (req, res) => {
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