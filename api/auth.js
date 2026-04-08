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
        <ul id="log" style="font-family:monospace;font-size:12px;padding:1rem 2rem;"></ul>
        <script>
        (function () {
          var token = ${JSON.stringify(token)};
          var msg = 'authorization:github:success:' + JSON.stringify({ token: token, provider: 'github' });

          var log = document.getElementById('log');
          function addLog(text) {
            var li = document.createElement('li');
            li.textContent = text;
            log.appendChild(li);
          }

          if (window.opener) {
            addLog('opener found, listening for messages...');
            window.addEventListener('message', function (e) {
              addLog('received: ' + JSON.stringify(e.data) + ' from ' + e.origin);
              if (typeof e.data === 'string' && e.data.indexOf('authorizing') !== -1) {
                addLog('sending token to ' + e.origin);
                window.opener.postMessage(msg, e.origin);
                setTimeout(function () { window.close(); }, 1000);
              }
            }, false);
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
