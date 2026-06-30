const bcrypt = require("bcryptjs");
const pool = require("./db");

async function resetAdminPassword() {
  try {
    const username = "admin";
    const newPassword = "admin123";

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username, role",
      [passwordHash, username]
    );

    if (result.rows.length === 0) {
      console.log("Admin user not found. Run node createAdmin.js first.");
      process.exit(1);
    }

    console.log("Admin password reset successfully");
    console.log("Username: admin");
    console.log("Password: admin123");

    process.exit();
  } catch (error) {
    console.error("Error resetting password:", error.message);
    process.exit(1);
  }
}

resetAdminPassword();