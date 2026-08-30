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
      await queryClient.invalidateQueries({ queryKey: queryKeys.retainers.lists() });
      router.replace({ pathname: '/retainers/[id]', params: { id: retainer.id } });
    },
  });

  return (
    <RetainerForm
      defaultValues={defaultValues}
      isSubmitting={mutation.isPending}
      submitLabel="Create Retainer"
      onSubmit={(values) => mutation.mutate(values)}
    />
  );
}
