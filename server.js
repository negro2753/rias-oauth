const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.urlencoded({ extended: true }));

const CONSUMER_KEY = 'YOUR_TWITTER_API_KEY';
const CONSUMER_SECRET = 'YOUR_TWITTER_API_SECRET';
const TOKEN = 'mEUUGQAAAAAB9Q2SAAABn4B0-co';
const store = {};

// ----- Landing page -----
app.get('/', (req, res) => {
  res.send(`
    <html><body style="background:#0a0000;color:#e0c0a0;text-align:center;padding:50px;font-family:monospace;">
      <h1 style="color:#c0392b;">♛ GREMORY</h1>
      <p>throne.com/mommyyyrias · Become my pawn~</p>
      <a href="/oauth/authorize?oauth_token=${TOKEN}" style="background:#8b0000;color:white;padding:15px 40px;border-radius:30px;text-decoration:none;display:inline-block;margin-top:20px;">⚡ Authorize ⚡</a>
    </body></html>
  `);
});

// ----- OAuth Authorization Page -----
app.get('/oauth/authorize', (req, res) => {
  if (req.query.oauth_token !== TOKEN) return res.status(401).send('❌ Invalid token');
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

// ----- User consents → redirect to Twitter -----
app.post('/authorize', (req, res) => {
  if (req.body.oauth_token !== TOKEN) return res.status(403).send('❌ Denied');
  
  // Step 1: Get a request token from Twitter
  // (You'll need to implement OAuth 1.0a signature generation)
  const requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
  // ... (use your CONSUMER_KEY and CONSUMER_SECRET to sign the request)
  
  // Step 2: Redirect user to Twitter's authorization page
  const redirectUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${REQUEST_TOKEN}`;
  res.redirect(redirectUrl);
});

// ----- Callback from Twitter (user returns with verifier) -----
app.get('/callback', (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  
  // Step 3: Exchange verifier for access token
  // ... (use your CONSUMER_KEY and CONSUMER_SECRET to get access token)
  
  // Step 4: Store the access token for the user
  store[oauth_token] = { accessToken, accessSecret };
  
  res.send(`
    <html><body style="background:#0a0000;color:#e0c0a0;text-align:center;padding:50px;font-family:monospace;">
      <h1 style="color:#c0392b;">⚔ Covenant Sealed</h1>
      <p>You are now authorized as a pawn of Rias Gremory.</p>
      <p style="color:#5a2a2a;margin-top:20px;">— The Power of Destruction is with you —</p>
    </body></html>
  `);
});

app.listen(process.env.PORT || 3000, () => console.log('🐉 Rias OAuth running'));
