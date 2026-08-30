import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { RetainerFormSchema, type RetainerFormValues } from '@/schemas/retainerForm';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FormField, FormInput, formStyles } from '@/components/ui/form';
import { ScreenShell } from '@/components/ui/screen-shell';
import { Spacing } from '@/constants/theme';

type RetainerFormProps = {
  cancelLabel?: string;
  defaultValues: RetainerFormValues;
  isSubmitting: boolean;
  serverError?: string;
  submitLabel: string;
  onCancel?: (isDirty: boolean) => void;
  onSubmit: (values: RetainerFormValues) => void;
};

const statuses: RetainerFormValues['status'][] = ['active', 'archived'];

export function RetainerForm({
  cancelLabel = 'Cancel',
  defaultValues,
  isSubmitting,
  onCancel,
  serverError,
  submitLabel,
  onSubmit,
}: RetainerFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<RetainerFormValues>({
    // Edit waits for its query before mounting this form, so async defaults are
    // applied once without resetting user edits during later query refetches.
    defaultValues,
    resolver: zodResolver(RetainerFormSchema),
  });
  const submit = handleSubmit((values) => {
    if (isSubmitting) return;

    // mutation.isPending disables the button for feedback, and this guard
    // closes the small double-tap window before React renders disabled=true.
    onSubmit(values);
  });

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoider}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {/* React Hook Form owns transient form values; MobX is for cross-screen
              UI preferences, not per-field editing state. */}
          <Controller
            control={control}
            name="clientName"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
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
              <FormField
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
              <FormField
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
              <FormField
                label="Status"
                error={errors.status?.message}
                input={
                  <View style={styles.statusRow}>
                    {/* React Native Pressable controls are not native inputs, so
                        Controller bridges RHF's value/onChange contract here. */}
                    {statuses.map((status) => (
                      <Chip
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
          {serverError ? (
            // The current API returns message-level errors, not field-level paths,
            // so server failures are shown at the form level.
            <ThemedText type="small" style={formStyles.errorText}>
              {serverError}
            </ThemedText>
          ) : null}
          <Button
            label={isSubmitting ? 'Saving...' : submitLabel}
            disabled={isSubmitting}
            onPress={submit}
          />
          {onCancel ? (
            <Button label={cancelLabel} onPress={() => onCancel(isDirty)} variant="secondary" />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
