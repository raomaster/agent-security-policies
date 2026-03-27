// Vulnerable: Missing authorization checks
const express = require('express');
const app = express();

// No auth middleware on admin routes
app.delete('/admin/users/:id', (req, res) => {
  // Vulnerable: no check if requesting user is admin
  deleteUser(req.params.id);
  res.json({ deleted: true });
});

app.put('/admin/settings', (req, res) => {
  // Vulnerable: anyone can modify settings
  updateSettings(req.body);
  res.json({ updated: true });
});

app.get('/users/:id/profile', (req, res) => {
  // Vulnerable: no check if requesting user owns this profile
  const profile = getProfile(req.params.id);
  res.json(profile);
});
