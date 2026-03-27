// Vulnerable: Stored XSS in comment rendering
import express from 'express';

interface Comment {
  id: number;
  author: string;
  body: string;
  createdAt: Date;
}

const comments: Comment[] = [];
const app = express();
app.use(express.json());

app.post('/comments', (req, res) => {
  const comment: Comment = {
    id: comments.length + 1,
    author: req.body.author,
    body: req.body.body,
    createdAt: new Date()
  };
  comments.push(comment);
  res.status(201).json(comment);
});

app.get('/comments', (_req, res) => {
  const html = comments.map(c =>
    `<div class="comment">
      <h3>${c.author}</h3>
      <p>${c.body}</p>
    </div>`
  ).join('\n');
  res.send(`<html><body>${html}</body></html>`);
});