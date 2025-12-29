const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Simple in-memory store (demo only)
let notes = [];

app.post('/sync', (req, res) => {
  // naive sync: accept client notes, return merged list
  const { clientNotes } = req.body;
  if (Array.isArray(clientNotes)) {
    // simple merge: prepend client notes
    notes = clientNotes.concat(notes);
  }
  res.json({ ok: true, serverNotes: notes });
});

app.post('/auth/login', (req, res) => {
  // demo stub
  res.json({ ok: true, token: 'demo-token' });
});

app.listen(3000, () => console.log('Demo sync server listening on http://localhost:3000'));
