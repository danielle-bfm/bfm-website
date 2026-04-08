// Redirects the CMS popup to GitHub's OAuth authorization page
module.exports = function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.SITE_URL + '/api/callback',
    scope: 'repo',
    state: req.query.state || '',
  });
  res.redirect(302, 'https://github.com/login/oauth/authorize?' + params);
};
