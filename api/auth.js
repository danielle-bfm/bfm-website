// Redirects the CMS popup to GitHub's OAuth authorization page
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23lic2inAPIwkvHH2T';
const SITE_URL  = process.env.SITE_URL  || 'https://betterfuture.media';

module.exports = function handler(req, res) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'repo',
    state: req.query.state || '',
  });
  res.redirect(302, 'https://github.com/login/oauth/authorize?' + params);
};
