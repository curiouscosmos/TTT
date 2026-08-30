import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

export function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: {
    height: Spacing.two,
  },
});
