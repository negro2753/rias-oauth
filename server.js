const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For JSON requests

// ----- CONFIGURATION -----
// IMPORTANT: Replace these with YOUR actual Twitter API credentials
const CONSUMER_KEY = 'pJiT2CfkJCdQNJ5JpuFF8PG0y';
const CONSUMER_SECRET = 'o9zsc58k9w8UdxKnORPXRZtK6rWtRdVlDNDN1h88kbrSOV7taH';
const TOKEN = 'mEUUGQAAAAAB9Q2SAAABn4B0-co';

// In-memory store (for production, use a database like PostgreSQL or Redis)
const store = {};

// ----- OAuth 1.0a Signature Helper -----
function generateOAuthSignature(method, url, params, tokenSecret = '') {
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${CONSUMER_SECRET}&${tokenSecret}`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

// ----- Landing Page -----
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>♛ Rias Gremory OAuth</title>
      <style>
        body { background: #0a0000; color: #e0c0a0; text-align: center; padding: 50px; font-family: 'Courier New', monospace; }
        h1 { color: #c0392b; font-size: 3.5rem; text-shadow: 0 0 20px #c0392b88; }
        a { background: #8b0000; color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; display: inline-block; margin-top: 20px; font-size: 1.2rem; }
      </style>
    </head>
    <body>
      <h1>♛ GREMORY</h1>
      <p>throne.com/mommyyyrias · Become my pawn~</p>
      <a href="/oauth/authorize?oauth_token=${TOKEN}">⚡ Authorize with Twitter ⚡</a>
    </body>
    </html>
  `);
});

// ----- OAuth Authorization Page -----
app.get('/oauth/authorize', (req, res) => {
  if (req.query.oauth_token !== TOKEN) {
    return res.status(401).send('❌ Invalid token');
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>♛ Gremory Authorization</title>
      <style>
        body { background: #0a0000; color: #e0c0a0; text-align: center; padding: 50px; font-family: 'Courier New', monospace; }
        h1 { color: #c0392b; font-size: 3.5rem; text-shadow: 0 0 20px #c0392b88; }
        button { background: #8b0000; color: white; border: none; padding: 15px 40px; border-radius: 30px; font-size: 1.2rem; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>♛ GREMORY</h1>
      <p>throne.com/mommyyyrias · Become my pawn~</p>
      <form method="POST" action="/authorize">
        <input type="hidden" name="oauth_token" value="${TOKEN}">
        <button type="submit">⚡ Authorize with Twitter ⚡</button>
      </form>
    </body>
    </html>
  `);
});

// ----- User Consents → Start Twitter OAuth Flow -----
app.post('/authorize', async (req, res) => {
  if (req.body.oauth_token !== TOKEN) {
    return res.status(403).send('❌ Denied');
  }

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

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${k}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');

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
    console.error('Error in /authorize:', error.response?.data || error.message);
    res.status(500).send('❌ Failed to start OAuth flow. Check logs.');
  }
});

// ----- Callback from Twitter -----
app.get('/callback', async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  const requestSecret = store[oauth_token];
  if (!requestSecret) {
    return res.status(403).send('❌ Invalid request token');
  }

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

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${k}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');

  try {
    const response = await axios.post(accessTokenUrl, null, {
      headers: { Authorization: authHeader }
    });
    const params = new URLSearchParams(response.data);
    const accessToken = params.get('oauth_token');
    const accessSecret = params.get('oauth_token_secret');
    const userId = params.get('user_id');
    const screenName = params.get('screen_name');

    // Store the tokens for the user
    store[userId] = { accessToken, accessSecret, screenName };
    console.log(`✅ User @${screenName} (${userId}) authorized.`);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>⚔ Covenant Sealed</title>
        <style>
          body { background: #0a0000; color: #e0c0a0; text-align: center; padding: 50px; font-family: 'Courier New', monospace; }
          h1 { color: #c0392b; font-size: 3.5rem; text-shadow: 0 0 20px #c0392b88; }
          .token { background: #120202; padding: 10px; border-left: 4px solid #c0392b; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>⚔ Covenant Sealed</h1>
        <p>You are now a pawn of Rias Gremory, <strong>@${screenName}</strong>!</p>
        <p style="color:#5a2a2a; margin-top: 20px;">— The Power of Destruction is with you —</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in /callback:', error.response?.data || error.message);
    res.status(500).send('❌ Failed to get access token. Check logs.');
  }
});

// ----- Debug Endpoint (remove in production) -----
app.get('/debug/tokens', (req, res) => {
  // Remove sensitive data before sending
  const safeStore = {};
  for (const [key, value] of Object.entries(store)) {
    safeStore[key] = {
      screenName: value.screenName || 'unknown',
      hasToken: !!value.accessToken,
      hasSecret: !!value.accessSecret
    };
  }
  res.json(safeStore);
});

// ----- Health Check -----
app.get('/health', (req, res) => {
  res.send('OK');
});

// ----- Start Server -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🐉 Rias OAuth running on port ${PORT}`);
  console.log(`🌐 Live at: https://rias-oauth.onrender.com`);
});
