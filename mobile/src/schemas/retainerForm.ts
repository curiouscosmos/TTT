import { z } from 'zod';

export const RetainerFormSchema = z.object({
  clientName: z.string().trim().min(1, 'Client name is required.'),
  leadEngineer: z.string().trim().min(1, 'Lead engineer is required.'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
      message: 'Enter a valid start date.',
    }),
  status: z.enum(['active', 'archived']),
});

export type RetainerFormValues = z.infer<typeof RetainerFormSchema>;
