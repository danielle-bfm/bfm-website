// Exchanges GitHub OAuth code for an access token, then posts it back to the CMS
const CLIENT_ID    = process.env.GITHUB_CLIENT_ID    || 'Ov23lic2inAPIwkvHH2T';
const SITE_URL     = process.env.SITE_URL            || 'https://betterfuture.media';
const REDIRECT_URI = SITE_URL + '/api/callback';

module.exports = async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    res.status(400).json({ error: 'Missing code', query: req.query, url: req.url });
    return;
  }

  try {
    if (!process.env.GITHUB_CLIENT_SECRET) {
      res.status(500).send('GITHUB_CLIENT_SECRET environment variable is not set');
      return;
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    const token = data.access_token;

    if (!token) {
      res.status(401).send('OAuth failed: ' + JSON.stringify(data));
      return;
    }

    // Send the token back to the Decap CMS window via postMessage
    const payload = JSON.stringify({ token, provider: 'github' });
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html><html><body><script>
      (function () {
        var payload = ${JSON.stringify(payload)};
        function onMessage(e) {
          window.opener.postMessage('authorization:github:success:' + payload, e.origin);
          window.close();
        }
        window.addEventListener('message', onMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script></body></html>`);
  } catch (err) {
    res.status(500).send('OAuth error: ' + err.message);
  }
};
