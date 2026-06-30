const bcrypt = require("bcryptjs");
const pool = require("./db");

async function createAdmin() {
  try {
    const name = "Admin";
    const username = "admin";
    const password = "admin123";
    const role = "Admin";

    const branchResult = await pool.query(
      "SELECT id FROM branches WHERE name = $1",
      ["Delhi"]
    );

    const branchId = branchResult.rows[0]?.id || null;

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      console.log("Admin user already exists");
      process.exit();
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users 
       (branch_id, name, username, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [branchId, name, username, passwordHash, role]
    );

    console.log("Admin user created successfully");
    console.log("Username: admin");
    console.log("Password: admin123");

    process.exit();
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    process.exit(1);
  }
}

createAdmin();