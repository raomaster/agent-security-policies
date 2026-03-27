// Safe: Uses execFile with arguments array
const { execFile } = require('child_process');
const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
  const host = req.query.host;
  // Validate input
  if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
    return res.status(400).send('Invalid hostname');
  }
  // Safe: execFile with args array (no shell interpretation)
  execFile('ping', ['-c', '4', host], (error, stdout) => {
    res.send(`<pre>${stdout}</pre>`);
  });
});

app.get('/lookup', (req, res) => {
  const domain = req.query.domain;
  if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return res.status(400).send('Invalid domain');
  }
  execFile('nslookup', [domain], (error, stdout) => {
    res.json({ result: stdout });
  });
});
