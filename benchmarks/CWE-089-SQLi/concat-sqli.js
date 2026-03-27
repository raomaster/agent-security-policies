// Vulnerable: SQL injection via string concatenation
const mysql = require('mysql2/promise');

async function getUser(userId) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  // Vulnerable: user input concatenated into query
  const query = "SELECT * FROM users WHERE id = " + userId;
  const [rows] = await connection.execute(query);
  await connection.end();
  return rows[0];
}

async function searchUsers(name) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  // Vulnerable: template literal with user input
  const query = `SELECT * FROM users WHERE name LIKE '%${name}%'`;
  const [rows] = await connection.execute(query);
  await connection.end();
  return rows;
}

async function deleteUser(id, isAdmin) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  // Vulnerable: even with "check", still concatenated
  if (isAdmin) {
    const query = "DELETE FROM users WHERE id = " + id;
    await connection.execute(query);
  }
  await connection.end();
}
