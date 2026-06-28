import { z } from 'zod';

export const generateSqlSchema = z.object({
  body: z.object({
    query: z
      .string({ required_error: 'Query is required' })
      .min(1, { message: 'Query cannot be empty' })
      .trim(),
    workspaceId: z
      .string()
      .uuid({ message: 'Workspace ID must be a valid UUID' })
      .optional(),
  }),
});
