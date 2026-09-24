const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    // Increase this number every new APK (allows install over old app without uninstall)
    versionCode: 4,
  },
  ios: {
    ...appJson.expo.ios,
    buildNumber: '4',
  },
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
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    eas: {
      projectId: '799097d3-64c8-44e9-b683-ba56645126e9',
    },
  },
};
