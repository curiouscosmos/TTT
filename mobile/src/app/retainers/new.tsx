import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { createRetainer } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { RetainerForm } from '@/components/RetainerForm';
import type { RetainerFormValues } from '@/schemas/retainerForm';

const defaultValues: RetainerFormValues = {
  clientName: '',
  leadEngineer: '',
  startDate: '',
  status: 'active',
};

export default function CreateRetainerScreen() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createRetainer,
    onSuccess: async (retainer) => {
      // Invalidate instead of manually inserting the response so TanStack Query
      // remains the only cache of retainer API data.
      await queryClient.invalidateQueries({ queryKey: queryKeys.retainers.lists() });
      // Replace keeps users off the completed create form, avoiding accidental resubmits.
      router.replace({ pathname: '/retainers/[id]', params: { id: retainer.id } });
    },
  });

  return (
    <RetainerForm
      defaultValues={defaultValues}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      submitLabel="Create Retainer"
      onSubmit={(values) => mutation.mutate(values)}
    />
  );
}
