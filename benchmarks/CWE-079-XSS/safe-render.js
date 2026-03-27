// Safe: Uses DOMPurify to sanitize user input
const DOMPurify = require('dompurify');
const express = require('express');
const app = express();

app.get('/profile', (req, res) => {
  const userInput = req.query.name;
  const sanitized = DOMPurify.sanitize(userInput);
  res.send(`
    <html>
      <body>
        <h1>Profile</h1>
        <div id="name">${sanitized}</div>
      </body>
    </html>
  `);
});

app.get('/items', (req, res) => {
  const items = ['<b>Item 1</b>', '<b>Item 2</b>'];
  // Using textContent instead of innerHTML - safe
  const script = `
    const container = document.getElementById('items');
    items.forEach(item => {
      const el = document.createElement('div');
      el.textContent = item;
      container.appendChild(el);
    });
  `;
  res.send(`<html><body><div id="items"></div><script>${script}</script></body></html>`);
});