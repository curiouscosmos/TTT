import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { getRetainer, updateRetainer } from '@/api/client';
import { getMutationErrorMessage, getQueryErrorMessage } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { RetainerForm } from '@/components/RetainerForm';
import { EmptyState, ErrorState, LoadingState } from '@/components/screen-state';
import { ScreenShell } from '@/components/ui/screen-shell';
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
      // Detail shows the edited record, lists show edited summary fields, and
      // at-risk displays overlapping summary data. Invalidate all three instead
      // of maintaining duplicate client-side caches.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.retainers.detail(retainer.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.retainers.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.retainers.atRisk }),
      ]);
      router.back();
    },
  });

  function handleCancel(isDirty: boolean) {
    if (!isDirty) {
      router.back();
      return;
    }

    // This covers the explicit Cancel path without building a full navigation
    // blocker for hardware/header back gestures.
    Alert.alert('Discard changes?', 'Your edits have not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (!id) {
    return (
      <ScreenShell>
        <EmptyState title="Missing retainer" message="This route needs a retainer id." />
      </ScreenShell>
    );
  }

  if (query.isPending) {
    return (
      <ScreenShell>
        <LoadingState message="Loading retainer..." />
      </ScreenShell>
    );
  }

  if (query.error || !query.data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Could not load retainer"
          message={getQueryErrorMessage(query.error, {
            notFoundMessage: 'The requested retainer could not be found.',
          })}
          onRetry={() => void query.refetch()}
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
      cancelLabel="Cancel"
      isSubmitting={mutation.isPending}
      serverError={mutation.error ? getMutationErrorMessage(mutation.error) : undefined}
      submitLabel="Save Retainer"
      onCancel={handleCancel}
      onSubmit={(values) => mutation.mutate(values)}
    />
  );
}

function toDateInputValue(date: string) {
  return date.slice(0, 10);
}
