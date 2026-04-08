// Handles both GitHub OAuth initiation and callback in one endpoint.
// GitHub redirects back here with ?code=xxx after the user authorizes.
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23lic2inAPIwkvHH2T';

module.exports = async function handler(req, res) {
  const { code } = req.query;

  // ── Callback: exchange code for token ─────────────────────────
  if (code) {
    if (!process.env.GITHUB_CLIENT_SECRET) {
      res.status(500).send('GITHUB_CLIENT_SECRET not set');
      return;
    }
    try {
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

      res.setHeader('Content-Type', 'text/html');
      res.send(`<!DOCTYPE html><html><body>
        <p style="font-family:sans-serif;padding:2rem">Authenticating — this window will close automatically.</p>
        <script>
        (function () {
          var token = ${JSON.stringify(token)};
          var msg = 'authorization:github:success:' + JSON.stringify({ token: token, provider: 'github' });

          if (window.opener) {
            window.addEventListener('message', function (e) {
              if (e.data === 'authorizing:github') {
                window.opener.postMessage(msg, e.origin);
                setTimeout(function () { window.close(); }, 1000);
              }
            }, false);
            window.opener.postMessage('authorizing:github', '*');
          } else {
            document.body.innerHTML = '<p style="font-family:sans-serif;padding:2rem">Authentication complete — you can close this window and return to the CMS.</p>';
          }
        })();
        </script>
      </body></html>`);
    } catch (err) {
      res.status(500).send('OAuth error: ' + err.message);
    }
    return;
  }

  // ── Initiation: redirect to GitHub OAuth ──────────────────────
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'repo',
  });
  res.redirect(302, 'https://github.com/login/oauth/authorize?' + params);
};
