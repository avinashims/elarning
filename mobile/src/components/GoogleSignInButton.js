import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import Button from './Button';

WebBrowser.maybeCompleteAuthSession();

function getGoogleClientIds() {
  const extra = Constants.expoConfig?.extra || {};
  return {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra.googleWebClientId || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra.googleAndroidClientId || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.googleIosClientId || '',
  };
}

export default function GoogleSignInButton({ onSuccess, role = 'STUDENT', disabled, style }) {
  const { webClientId, androidClientId, iosClientId } = getGoogleClientIds();
  const configured = !!(webClientId && androidClientId);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    androidClientId,
    iosClientId: iosClientId || webClientId,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'dismiss' || response.type === 'cancel') {
      setLoading(false);
      return;
    }

    if (response.type !== 'success') {
      if (response.type === 'error') {
        Alert.alert('Google sign-in failed', response.error?.message || 'Could not sign in with Google');
      }
      setLoading(false);
      return;
    }

    const idToken = response.params?.id_token || response.authentication?.idToken;
    if (!idToken) {
      Alert.alert('Google sign-in failed', 'No token returned from Google');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const userData = await onSuccess(idToken, role);
        if (userData) {
          // navigation handled by parent via onSuccess return or callback
        }
      } catch (err) {
        Alert.alert('Sign-in failed', err.response?.data?.message || err.message || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [response, onSuccess, role]);

  if (!configured) {
    return null;
  }

  const handlePress = async () => {
    setLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      setLoading(false);
      Alert.alert('Google sign-in failed', err.message || 'Could not open Google sign-in');
    }
  };

  return (
    <Button
      title="Continue with Google"
      variant="secondary"
      onPress={handlePress}
      loading={loading}
      disabled={disabled || !request || loading}
      style={style}
    />
  );
}
