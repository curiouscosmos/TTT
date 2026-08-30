import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRetainer, updateRetainer } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { RetainerForm } from '@/components/RetainerForm';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RetainerFormValues } from '@/schemas/retainerForm';

export default function EditRetainerScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: id ? queryKeys.retainers.detail(id) : queryKeys.retainers.detail('missing-id'),
    queryFn: () => getRetainer(id ?? ''),
    enabled: Boolean(id),
  });
  const mutation = useMutation({
    mutationFn: (values: RetainerFormValues) => updateRetainer(id ?? '', values),
    onSuccess: async (retainer) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.retainers.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.retainers.detail(retainer.id) }),
      ]);
      router.replace({ pathname: '/retainers/[id]', params: { id: retainer.id } });
    },
  });

  if (!id) {
    return (
      <ScreenShell>
        <StateView title="Missing retainer" message="This route needs a retainer id." />
      </ScreenShell>
    );
  }

  if (query.isLoading) {
    return (
      <ScreenShell>
        <StateView title="Loading retainer..." icon={<ActivityIndicator />} />
      </ScreenShell>
    );
  }

  if (query.error || !query.data) {
    return (
      <ScreenShell>
        <StateView
          title="Could not load retainer"
          message={query.error instanceof Error ? query.error.message : 'Something went wrong.'}
          action={<Button label="Retry" onPress={() => void query.refetch()} />}
        />
      </ScreenShell>
    );
  }

  return (
    <RetainerForm
      defaultValues={{
        clientName: query.data.clientName,
        leadEngineer: query.data.leadEngineer,
        // The API returns ISO timestamps, while the form submits the date-only
        // string the API accepts for writes.
        startDate: toDateInputValue(query.data.startDate),
        status: query.data.status,
      }}
      isSubmitting={mutation.isPending}
      submitLabel="Save Retainer"
      onSubmit={(values) => mutation.mutate(values)}
    />
  );
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </ThemedView>
  );
}

function StateView({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.centerState}>
      {icon}
      <ThemedText type="subtitle" style={styles.centerText}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          {message}
        </ThemedText>
      ) : null}
      {action}
    </View>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.text }]}>
      <ThemedText type="smallBold" style={{ color: theme.background }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function toDateInputValue(date: string) {
  return date.slice(0, 10);
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
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
});
