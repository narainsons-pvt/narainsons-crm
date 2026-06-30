const pool = require("../db");

async function createAuditLog(userId, action, details, ipAddress) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userId, action, details, ipAddress]
    );
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
}

module.exports = createAuditLog;