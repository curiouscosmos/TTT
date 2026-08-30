import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RetainerFormSchema, type RetainerFormValues } from '@/schemas/retainerForm';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type RetainerFormProps = {
  defaultValues: RetainerFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: RetainerFormValues) => void;
};

const statuses: RetainerFormValues['status'][] = ['active', 'archived'];

export function RetainerForm({
  defaultValues,
  isSubmitting,
  submitLabel,
  onSubmit,
}: RetainerFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RetainerFormValues>({
    defaultValues,
    resolver: zodResolver(RetainerFormSchema),
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoider}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}>
            {/* React Hook Form owns transient form values; MobX is for cross-screen
                UI preferences, not per-field editing state. */}
            <Controller
              control={control}
              name="clientName"
              render={({ field: { onBlur, onChange, value } }) => (
                <Field
                  label="Client name"
                  error={errors.clientName?.message}
                  input={
                    <FormInput
                      accessibilityLabel="Client name"
                      autoCapitalize="words"
                      returnKeyType="next"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  }
                />
              )}
            />
            <Controller
              control={control}
              name="leadEngineer"
              render={({ field: { onBlur, onChange, value } }) => (
                <Field
                  label="Lead engineer"
                  error={errors.leadEngineer?.message}
                  input={
                    <FormInput
                      accessibilityLabel="Lead engineer"
                      autoCapitalize="words"
                      returnKeyType="next"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  }
                />
              )}
            />
            <Controller
              control={control}
              name="startDate"
              render={({ field: { onBlur, onChange, value } }) => (
                <Field
                  label="Start date"
                  error={errors.startDate?.message}
                  input={
                    <FormInput
                      accessibilityLabel="Start date"
                      inputMode="numeric"
                      placeholder="YYYY-MM-DD"
                      returnKeyType="done"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  }
                />
              )}
            />
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <Field
                  label="Status"
                  error={errors.status?.message}
                  input={
                    <View style={styles.statusRow}>
                      {/* React Native Pressable controls are not native inputs, so
                          Controller bridges RHF's value/onChange contract here. */}
                      {statuses.map((status) => (
                        <StatusOption
                          key={status}
                          label={status}
                          selected={value === status}
                          onPress={() => onChange(status)}
                        />
                      ))}
                    </View>
                  }
                />
              )}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Client validation keeps obvious mistakes local; the API still validates every write.
            </ThemedText>
            <SubmitButton
              label={isSubmitting ? 'Saving...' : submitLabel}
              disabled={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, input, error }: { label: string; input: React.ReactNode; error?: string }) {
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

function FormInput(props: React.ComponentProps<typeof TextInput>) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      {...props}
    />
  );
}

function StatusOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Status ${label}`}
      onPress={onPress}
      style={[
        styles.statusOption,
        { backgroundColor: selected ? theme.text : theme.backgroundElement },
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function SubmitButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.submitButton, { backgroundColor: theme.text }, disabled && styles.disabled]}>
      <ThemedText type="smallBold" style={{ color: theme.background }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: 8,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statusOption: {
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.four,
  },
  disabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#c12a2a',
  },
});
