import { z } from 'zod';

export const generateSqlSchema = z.object({
  body: z.object({
    query: z
      .string({ required_error: 'Query is required' })
      .min(1, { message: 'Query cannot be empty' })
      .trim(),
  }),
});
