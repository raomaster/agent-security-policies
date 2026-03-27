// Vulnerable: Logging sensitive information
const express = require('express');
const winston = require('winston');
const app = express();

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Vulnerable: password logged in plaintext
  logger.info(`Login attempt: user=${username} password=${password}`);
  authenticateUser(username, password);
  res.json({ success: true });
});

app.post('/api/data', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  // Vulnerable: API key logged
  logger.info(`API request from key: ${apiKey}`);
  processData(req.body);
  res.json({ ok: true });
});
