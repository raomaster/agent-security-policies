// Safe: crypto.randomBytes for security purposes
const crypto = require('crypto');

function generateToken() {
  // Safe: cryptographically secure random
  return crypto.randomBytes(32).toString('hex');
}

function generateSessionId() {
  // Safe: secure random session ID
  return 'sess_' + crypto.randomBytes(16).toString('base64url');
}

function generateResetCode() {
  // Safe: crypto-based code generation
  const code = crypto.randomInt(1000, 9999);
  return code.toString();
}
