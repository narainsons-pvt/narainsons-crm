const express = require("express");
const pool = require("../db");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { customer_id, assigned_to, task_type, due_date } = req.body;

  const result = await pool.query(
    `INSERT INTO tasks (customer_id, assigned_to, task_type, due_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [customer_id, assigned_to, task_type, due_date]
  );

  res.status(201).json(result.rows[0]);
});

router.get("/", authMiddleware, async (req, res) => {
  const result = await pool.query(
    `SELECT tasks.*, customers.customer_name, customers.pan_number
     FROM tasks
     LEFT JOIN customers ON tasks.customer_id = customers.id
     ORDER BY tasks.created_at DESC`
  );

  res.json(result.rows);
});

router.put("/:id/status", authMiddleware, async (req, res) => {
  const { status } = req.body;

  const result = await pool.query(
    "UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );

  res.json(result.rows[0]);
});

module.exports = router;