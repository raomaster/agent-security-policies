// Safe: Validates file paths against allowlist
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const UPLOADS_DIR = '/var/data/uploads';

// Allowlist of permitted files
const ALLOWED_FILES = ['readme.txt', 'config.json', 'help.md'];

app.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;

  // Validate against allowlist
  if (!ALLOWED_FILES.includes(filename)) {
    return res.status(403).send('Access denied');
  }

  // Resolve and verify path stays within uploads dir
  const filePath = path.resolve(UPLOADS_DIR, filename);
  if (!filePath.startsWith(path.resolve(UPLOADS_DIR))) {
    return res.status(403).send('Access denied');
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  res.send(content);
});
