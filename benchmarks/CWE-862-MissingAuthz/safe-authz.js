// Safe: Proper authorization middleware
const express = require('express');
const app = express();

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  req.user = verifyToken(token);
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function requireOwnership(req, res, next) {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

app.delete('/admin/users/:id', requireAuth, requireRole('admin'), (req, res) => {
  deleteUser(req.params.id);
  res.json({ deleted: true });
});

app.get('/users/:id/profile', requireAuth, requireOwnership, (req, res) => {
  const profile = getProfile(req.params.id);
  res.json(profile);
});
