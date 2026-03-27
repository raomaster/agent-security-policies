// Safe: Uses parameterized queries
const mysql = require('mysql2/promise');

async function getUser(userId) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  // Safe: parameterized query with placeholder
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
  await connection.end();
  return rows[0];
}

async function searchUsers(name, role) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  // Safe: multiple parameters
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE name LIKE ? AND role = ?',
    [`%${name}%`, role]
  );
  await connection.end();
  return rows;
}
