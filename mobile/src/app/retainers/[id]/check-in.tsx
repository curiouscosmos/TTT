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
  View,
} from 'react-native';

import { createCheckIn } from '@/api/client';
import { getMutationErrorMessage } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { EmptyState } from '@/components/screen-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormField, FormInput, formStyles } from '@/components/ui/form';
import { ScreenShell } from '@/components/ui/screen-shell';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CheckInFormSchema, type CheckInFormValues } from '@/schemas/checkInForm';
import type { HealthStatus } from '@/types/api';
import { todayDateInputValue } from '@/utils/date';

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
  const submit = handleSubmit((values) => {
    if (mutation.isPending) return;

    mutation.mutate(values);
  });

  if (!id) {
    return (
      <ScreenShell>
        <EmptyState title="Missing retainer" message="This route needs a retainer id." />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoider}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Controller
            control={control}
            name="date"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
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
              <FormField
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
                    style={formStyles.multilineInput}
                  />
                }
              />
            )}
          />
          <Controller
            control={control}
            name="ragStatus"
            render={({ field: { onChange, value } }) => (
              <FormField
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
              <FormField
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
                    style={formStyles.multilineInput}
                  />
                }
              />
            )}
          />
          {mutation.error ? (
            <ThemedText type="small" style={formStyles.errorText}>
              {getMutationErrorMessage(mutation.error)}
            </ThemedText>
          ) : null}
          <Button
            label={mutation.isPending ? 'Saving...' : 'Add Check-in'}
            disabled={mutation.isPending}
            onPress={submit}
          />
          <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
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

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
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
});
