// Vulnerable: Authentication bypass via JWT none algorithm
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();

const SECRET = process.env.JWT_SECRET;

app.get('/admin', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  // Vulnerable: allows 'none' algorithm
  const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256', 'none'] });
  res.json({ message: 'Admin access granted', user: decoded });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Vulnerable: timing attack possible with string comparison
  if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
