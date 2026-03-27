// Vulnerable: Math.random() for security purposes
function generateToken() {
  // Vulnerable: Math.random() is not cryptographically secure
  return Math.random().toString(36).substring(2);
}

function generateSessionId() {
  // Vulnerable: predictable session ID
  return 'sess_' + Math.random().toString(36).substr(2, 16);
}

function generateResetCode() {
  // Vulnerable: 4-digit code from Math.random
  return Math.floor(1000 + Math.random() * 9000).toString();
}
