import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function LoadingScreen({ message }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});
