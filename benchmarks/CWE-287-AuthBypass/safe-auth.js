// Safe: Proper JWT verification
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();

const SECRET = process.env.JWT_SECRET;

app.get('/admin', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  // Safe: explicit algorithm, no 'none'
  const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ message: 'Admin access granted', user: decoded });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Safe: bcrypt comparison (constant-time)
  const user = await findUser(username);
  if (user && await bcrypt.compare(password, user.hash)) {
    const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, {
      algorithm: 'HS256',
      expiresIn: '1h'
    });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
