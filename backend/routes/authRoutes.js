const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query(
    "SELECT users.*, branches.name AS branch_name FROM users LEFT JOIN branches ON users.branch_id = branches.id WHERE username = $1",
    [username]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      branch_id: user.branch_id,
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.SESSION_TIMEOUT || "8h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      branch_id: user.branch_id,
      branch_name: user.branch_name
    }
  });
});

module.exports = router;