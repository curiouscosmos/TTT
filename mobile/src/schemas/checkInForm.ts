import { z } from 'zod';

export const CheckInFormSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
      message: 'Enter a valid check-in date.',
    }),
  summary: z.string().trim().min(1, 'Summary is required.'),
  ragStatus: z.enum(['green', 'amber', 'red']),
  riskNote: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional(),
});

export type CheckInFormValues = z.infer<typeof CheckInFormSchema>;
