const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  plugins: [
    'expo-asset',
    'expo-font',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://165.22.209.200:9001/api',
    eas: {
      projectId: '799097d3-64c8-44e9-b683-ba56645126e9',
    },
  },
};
