import Constants from 'expo-constants';

export const colors = {
  primary: '#5624d0',
  primaryDark: '#401b9c',
  primaryLight: '#7c4dff',
  accent: '#a435f0',
  secondary: '#1c1d1f',
  success: '#5cb85c',
  warning: '#b4690e',
  danger: '#d41b2c',
  bg: '#ffffff',
  bgSection: '#f7f9fa',
  bgCard: '#ffffff',
  bgHover: '#f3f4f6',
  bgDark: '#1c1d1f',
  text: '#1c1d1f',
  textLight: '#ffffff',
  textMuted: '#6a6f73',
  border: '#d1d7dc',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://10.0.2.2:5000/api';
