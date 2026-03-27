// Safe: Strong cryptographic algorithms
const crypto = require('crypto');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  // Safe: bcrypt with proper salt rounds
  return bcrypt.hash(password, 12);
}

function encryptData(data, key) {
  // Safe: AES-256-GCM
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { iv: iv.toString('hex'), encrypted, tag };
}

function generateChecksum(data) {
  // Safe: SHA-256
  return crypto.createHash('sha256').update(data).digest('hex');
}
