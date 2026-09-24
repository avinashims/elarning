const { OAuth2Client } = require('google-auth-library');
const config = require('../config');

function getClient() {
  const clientIds = config.google.clientIds;
  if (!clientIds.length) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }
  return new OAuth2Client(clientIds[0]);
}

async function verifyGoogleIdToken(idToken) {
  const clientIds = config.google.clientIds;
  if (!clientIds.length) {
    const err = new Error('Google sign-in is not configured on the server');
    err.statusCode = 503;
    throw err;
  }

  const client = getClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientIds,
  });
  return ticket.getPayload();
}

module.exports = { verifyGoogleIdToken };
