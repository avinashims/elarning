const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://YOUR-API-URL.onrender.com/api',
    eas: {
      projectId: process.env.EAS_PROJECT_ID || undefined,
    },
  },
};
