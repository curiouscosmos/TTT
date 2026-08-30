import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
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

import { createCheckIn } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CheckInFormSchema, type CheckInFormValues } from '@/schemas/checkInForm';
import type { HealthStatus } from '@/types/api';

const ragStatuses: HealthStatus[] = ['green', 'amber', 'red'];

export default function AddCheckInScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  // Expo Router can surface repeated params as arrays; this write route needs
  // exactly one retainer id for the API path and cache invalidation keys.
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: CheckInFormValues) => createCheckIn(id ?? '', values),
    onSuccess: async () => {
      if (!id) return;

      // The API recomputes health from check-in history. Invalidate every query
      // that displays health/latest-check-in data instead of mutating it locally.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.retainers.detail(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.retainers.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.retainers.atRisk }),
      ]);
      router.back();
    },
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckInFormValues>({
    defaultValues: {
      date: todayDateInputValue(),
      summary: '',
      ragStatus: 'green',
      riskNote: '',
    },
    resolver: zodResolver(CheckInFormSchema),
  });

  if (!id) {
    return (
      <ScreenShell>
        <View style={styles.centerState}>
          <ThemedText type="subtitle" style={styles.centerText}>
            Missing retainer
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            This route needs a retainer id.
          </ThemedText>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoider}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Add Check-in</ThemedText>
          <Controller
            control={control}
            name="date"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field
                label="Date"
                error={errors.date?.message}
                input={
                  <FormInput
                    accessibilityLabel="Check-in date"
                    inputMode="numeric"
                    placeholder="YYYY-MM-DD"
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
            name="summary"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field
                label="Summary"
                error={errors.summary?.message}
                input={
                  <FormInput
                    accessibilityLabel="Check-in summary"
                    multiline
                    returnKeyType="next"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.multilineInput}
                  />
                }
              />
            )}
          />
          <Controller
            control={control}
            name="ragStatus"
            render={({ field: { onChange, value } }) => (
              <Field
                label="RAG status"
                error={errors.ragStatus?.message}
                input={
                  <View style={styles.ragRow}>
                    {/* Pressable chips are custom controls, so Controller connects
                        their selected value to React Hook Form. */}
                    {ragStatuses.map((status) => (
                      <RagOption
                        key={status}
                        status={status}
                        selected={value === status}
                        onPress={() => onChange(status)}
                      />
                    ))}
                  </View>
                }
              />
            )}
          />
          <Controller
            control={control}
            name="riskNote"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field
                label="Risk note"
                error={errors.riskNote?.message}
                input={
                  <FormInput
                    accessibilityLabel="Risk note"
                    multiline
                    placeholder="Optional"
                    returnKeyType="done"
                    value={value ?? ''}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.multilineInput}
                  />
                }
              />
            )}
          />
          {mutation.error ? (
            <ThemedText type="small" style={styles.errorText}>
              {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong.'}
            </ThemedText>
          ) : null}
          <SubmitButton
            label={mutation.isPending ? 'Saving...' : 'Add Check-in'}
            disabled={mutation.isPending}
            onPress={handleSubmit((values) => mutation.mutate(values))}
          />
          <SecondaryButton label="Cancel" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
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
      style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }, props.style]}
      {...props}
    />
  );
}

function RagOption({
  status,
  selected,
  onPress,
}: {
  status: HealthStatus;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`RAG status ${status}`}
      onPress={onPress}
      style={[
        styles.ragOption,
        styles[`${status}Option`],
        selected && { borderColor: theme.text, borderWidth: 3 },
      ]}>
      <ThemedText type="smallBold" style={styles.ragText}>
        {status.toUpperCase()}
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
      style={[styles.button, { backgroundColor: theme.text }, disabled && styles.disabled]}>
      <ThemedText type="smallBold" style={{ color: theme.background }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

function todayDateInputValue() {
  // The API accepts date-only strings; use local date components so the default
  // does not jump a day for users outside UTC.
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
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
  multilineInput: {
    minHeight: 96,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
  ragRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  ragOption: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 3,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  greenOption: {
    backgroundColor: '#148a48',
  },
  amberOption: {
    backgroundColor: '#a46300',
  },
  redOption: {
    backgroundColor: '#c12a2a',
  },
  ragText: {
    color: '#ffffff',
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.four,
  },
  disabled: {
    opacity: 0.6,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  errorText: {
    color: '#c12a2a',
  },
});
