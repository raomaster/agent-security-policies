// Vulnerable: Path traversal via user-controlled file path
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const UPLOADS_DIR = '/var/data/uploads';

app.get('/files/:filename', (req, res) => {
  // Vulnerable: user-controlled filename joined without validation
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  res.send(content);
});

app.get('/download', (req, res) => {
  // Vulnerable: direct user input in file path
  const file = req.query.path;
  res.download(file);
});

app.get('/reports/:year/:month', (req, res) => {
  // Vulnerable: path traversal via URL params
  const reportPath = `/data/reports/${req.params.year}/${req.params.month}/report.pdf`;
  res.sendFile(reportPath);
});
