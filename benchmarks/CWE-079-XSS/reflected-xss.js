// Vulnerable: Reflected XSS via innerHTML
const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`
    <html>
      <body>
        <h1>Search Results</h1>
        <div id="results">Results for: ${query}</div>
        <script>document.getElementById('results').innerHTML = '${query}';</script>
      </body>
    </html>
  `);
});