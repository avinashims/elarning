import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user',
};

export async function getAccessToken() {
  return AsyncStorage.getItem(KEYS.accessToken);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(KEYS.refreshToken);
}

export async function getUser() {
  const raw = await AsyncStorage.getItem(KEYS.user);
  return raw ? JSON.parse(raw) : null;
}

export async function storeAuth({ user, accessToken, refreshToken }) {
  await AsyncStorage.multiSet([
    [KEYS.accessToken, accessToken],
    [KEYS.refreshToken, refreshToken],
    [KEYS.user, JSON.stringify(user)],
  ]);
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([KEYS.accessToken, KEYS.refreshToken, KEYS.user]);
}
