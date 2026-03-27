// Safe: Redacts sensitive data before logging
const express = require('express');
const winston = require('winston');
const app = express();

function redact(obj, fields = ['password', 'token', 'secret', 'apiKey', 'creditCard']) {
  const redacted = { ...obj };
  for (const field of fields) {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]';
    }
  }
  return redacted;
}

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Safe: password redacted
  logger.info('Login attempt', redact({ user: username, password }));
  authenticateUser(username, password);
  res.json({ success: true });
});
