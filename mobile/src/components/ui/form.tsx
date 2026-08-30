import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function FormField({
  label,
  input,
  error,
}: {
  label: string;
  input: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {input}
      {error ? (
        <ThemedText type="small" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function FormInput(props: React.ComponentProps<typeof TextInput>) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[
        styles.input,
        { backgroundColor: theme.backgroundElement, color: theme.text },
        props.style,
      ]}
      {...props}
    />
  );
}

export const formStyles = StyleSheet.create({
  errorText: {
    color: '#c12a2a',
  },
  multilineInput: {
    minHeight: 96,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
});

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: 8,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
  },
  errorText: formStyles.errorText,
});
