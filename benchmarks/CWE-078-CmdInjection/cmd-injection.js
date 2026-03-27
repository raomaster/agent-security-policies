// Vulnerable: OS command injection
const { exec } = require('child_process');
const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
  const host = req.query.host;
  // Vulnerable: user input in shell command
  exec(`ping -c 4 ${host}`, (error, stdout) => {
    res.send(`<pre>${stdout}</pre>`);
  });
});

app.get('/lookup', (req, res) => {
  const domain = req.query.domain;
  // Vulnerable: string interpolation in exec
  exec('nslookup ' + domain, (error, stdout) => {
    res.json({ result: stdout });
  });
});
