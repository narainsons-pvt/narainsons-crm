const express = require("express");
const pool = require("../db");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const { pan, mobile, name, branch_id } = req.query;

  let query = `
    SELECT customers.*, branches.name AS branch_name
    FROM customers
    LEFT JOIN branches ON customers.branch_id = branches.id
    WHERE 1 = 1
  `;

  const values = [];

  if (pan) {
    values.push(`%${pan}%`);
    query += ` AND customers.pan_number ILIKE $${values.length}`;
  }

  if (mobile) {
    values.push(`%${mobile}%`);
    query += ` AND customers.mobile_number ILIKE $${values.length}`;
  }

  if (name) {
    values.push(`%${name}%`);
    query += ` AND customers.customer_name ILIKE $${values.length}`;
  }

  if (branch_id) {
    values.push(branch_id);
    query += ` AND customers.branch_id = $${values.length}`;
  }

  query += " ORDER BY customers.created_at DESC";

  const result = await pool.query(query, values);
  res.json(result.rows);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM customers WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Customer not found" });
  }

  res.json(result.rows[0]);
});

router.put("/:id", authMiddleware, async (req, res) => {
  const {
    customer_name,
    mobile_number,
    email,
    address,
    customer_status,
    document_status
  } = req.body;

  const result = await pool.query(
    `UPDATE customers
     SET customer_name = $1,
         mobile_number = $2,
         email = $3,
         address = $4,
         customer_status = $5,
         document_status = $6,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING *`,
    [
      customer_name,
      mobile_number,
      email,
      address,
      customer_status,
      document_status,
      req.params.id
    ]
  );

  res.json(result.rows[0]);
});

module.exports = router;