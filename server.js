const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));

const CONSUMER_KEY = 'pJiT2CfkJCdQNJ5JpuFF8PG0y';
const CONSUMER_SECRET = 'o9zsc58k9w8UdxKnORPXRZtK6rWtRdVlDNDN1h88kbrSOV7taH';
const TOKEN = 'mEUUGQAAAAAB9Q2SAAABn4B0-co';
const store = {};

// Helper: OAuth 1.0a Signature
function generateOAuthSignature(method, url, params, tokenSecret = '') {
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${CONSUMER_SECRET}&${tokenSecret}`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

// Landing page
app.get('/', (req, res) => {
  res.send(`
    <html><body style="background:#0a0000;color:#e0c0a0;text-align:center;padding:50px;font-family:monospace;">
      <h1 style="color:#c0392b;">♛ GREMORY</h1>
      <p>throne.com/mommyyyrias · Become my pawn~</p>
      <a href="/oauth/authorize?oauth_token=${TOKEN}" style="background:#8b0000;color:white;padding:15px 40px;border-radius:30px;text-decoration:none;display:inline-block;margin-top:20px;">⚡ Authorize ⚡</a>
    </body></html>
  `);
});

// OAuth Authorization Page
app.get('/oauth/authorize', (req, res) => {
  if (req.query.oauth_token !== TOKEN) return res.status(401).send('❌ Invalid token');
  res.send(`
    <html><body style="background:#0a0000;color:#e0c0a0;text-align:center;padding:50px;font-family:monospace;">
      <h1 style="color:#c0392b;">♛ GREMORY</h1>
      <p>throne.com/mommyyyrias · Become my pawn~</p>
      <form method="POST" action="/authorize">
        <input type="hidden" name="oauth_token" value="${TOKEN}">
        <button style="background:#8b0000;color:white;border:none;padding:15px 40px;font-size:20px;border-radius:30px;cursor:pointer;">⚡ Authorize with Twitter ⚡</button>
      </form>
    </body></html>
  `);
});

// User consents -> start Twitter OAuth flow
app.post('/authorize', async (req, res) => {
  if (req.body.oauth_token !== TOKEN) return res.status(403).send('❌ Denied');
  
  const requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
  const oauthParams = {
    oauth_callback: 'https://rias-oauth.onrender.com/callback',
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000),
    oauth_version: '1.0'
  };
  oauthParams.oauth_signature = generateOAuthSignature('POST', requestTokenUrl, oauthParams);
  
  const authHeader = 'OAuth ' + Object.keys(oauthParams).map(k => `${k}="${encodeURIComponent(oauthParams[k])}"`).join(', ');
  
  try {
    const response = await axios.post(requestTokenUrl, null, {
      headers: { Authorization: authHeader }
    });
    const params = new URLSearchParams(response.data);
    const requestToken = params.get('oauth_token');
    const requestSecret = params.get('oauth_token_secret');
    
    store[requestToken] = requestSecret;
    res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${requestToken}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('❌ Failed to start OAuth flow');
  }
});

// ----- 🔥 THE FIX: Callback Route -----
app.get('/callback', async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  const requestSecret = store[oauth_token];
  if (!requestSecret) return res.status(403).send('❌ Invalid request token');
  
  const accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
  const oauthParams = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000),
    oauth_token: oauth_token,
    oauth_verifier: oauth_verifier,
    oauth_version: '1.0'
  };
  oauthParams.oauth_signature = generateOAuthSignature('POST', accessTokenUrl, oauthParams, requestSecret);
  
  const authHeader = 'OAuth ' + Object.keys(oauthParams).map(k => `${k}="${encodeURIComponent(oauthParams[k])}"`).join(', ');
  
  try {
    const response = await axios.post(accessTokenUrl, null, {
      headers: { Authorization: authHeader }
    });
    const params = new URLSearchParams(response.data);
    const accessToken = params.get('oauth_token');
    const accessSecret = params.get('oauth_token_secret');
    const userId = params.get('user_id');
    const screenName = params.get('screen_name');
    
    store[userId] = { accessToken, accessSecret };
    
    res.send(`
      <html><body style="background:#0a0000;color:#e0c0a0;text-align:center;padding:50px;font-family:monospace;">
        <h1 style="color:#c0392b;">⚔ Covenant Sealed</h1>
        <p>You are now a pawn of Rias Gremory, <strong>@${screenName}</strong>!</p>
        <p style="color:#5a2a2a;margin-top:20px;">— The Power of Destruction is with you —</p>
      </body></html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('❌ Failed to get access token');
  }
});

app.listen(process.env.PORT || 3000, () => console.log('🐉 Rias OAuth running'));
