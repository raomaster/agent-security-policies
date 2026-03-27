// Vulnerable: Weak cryptographic algorithms
const crypto = require('crypto');

function hashPassword(password) {
  // Vulnerable: MD5 is broken for password hashing
  return crypto.createHash('md5').update(password).digest('hex');
}

function generateChecksum(data) {
  // Vulnerable: SHA1 is deprecated
  return crypto.createHash('sha1').update(data).digest('hex');
}

function encryptData(data, key) {
  // Vulnerable: DES is weak
  const cipher = crypto.createCipher('des', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
