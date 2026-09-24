/** User-facing message for login/register API failures. */
export function getAuthErrorMessage(err, fallback = 'Request failed') {
  if (!err.response) {
    return 'Cannot reach the server. The API may be down — ask your admin to restart elearning-api on the server.';
  }
  if (err.response.status === 502 || err.response.status === 503) {
    return 'Server is temporarily unavailable (API not running). Try again after the site is redeployed.';
  }
  if (typeof err.response.data?.message === 'string') {
    return err.response.data.message;
  }
  if (Array.isArray(err.response.data?.errors) && err.response.data.errors.length) {
    return err.response.data.errors.join(' ');
  }
  return fallback;
}
