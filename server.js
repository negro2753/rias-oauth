const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.urlencoded({ extended: true }));

const TOKEN = 'mEUUGQAAAAAB9Q2SAAABn4B0-co';
const store = {};

// Main page
app.get('/', (req, res) => {
  res.send(`
    <html><body style="background:#0a0000;color:#e0c0a0;text-align:center;padding:50px;font-family:monospace;">
      <h1 style="color:#c0392b;">♛ GREMORY</h1>
      <p>throne.com/mommyyyrias · Become my pawn~</p>
      <a href="/oauth/authorize?oauth_token=${TOKEN}" style="background:#8b0000;color:white;padding:15px 40px;border-radius:30px;text-decoration:none;display:inline-block;margin-top:20px;">⚡ Authorize ⚡</a>
    </body></html>
  `);
});

// OAuth page
app.get('/oauth/authorize', (req, res) => {
  if (req.query.oauth_token !== TOKEN) return res.status(401).send('Invalid token');
  res.send(`
    <html><body style="background:#0a0000;color:#e0c0a0;text-align:center;padding:50px;font-family:monospace;">
      <h1 style="color:#c0392b;">♛ GREMORY</h1>
      <p>throne.com/mommyyyrias · Become my pawn~</p>
      <form method="POST" action="/authorize">
        <input type="hidden" name="oauth_token" value="${TOKEN}">
        <button style="background:#8b0000;color:white;border:none;padding:15px 40px;font-size:20px;border-radius:30px;cursor:pointer;">⚡ Authorize ⚡</button>
      </form>
    </body></html>
  `);
});

// Authorization handler
app.post('/authorize', (req, res) => {
  if (req.body.oauth_token !== TOKEN) return res.status(403).send('Denied');
  const verifier = crypto.randomBytes(12).toString('hex');
  store[TOKEN] = verifier;
  res.send(`
    <html><body style="background:#0a0000;color:#e0c0a0;text-align:center;padding:50px;font-family:monospace;">
      <h1 style="color:#c0392b;">⚔ Covenant Sealed</h1>
      <p>Verifier: <strong style="color:#d4a373;">${verifier}</strong></p>
      <p style="color:#5a2a2a;margin-top:20px;">— The Power of Destruction is with you —</p>
    </body></html>
  `);
});

app.listen(process.env.PORT || 3000, () => console.log('Rias OAuth running'));
