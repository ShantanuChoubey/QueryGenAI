import { z } from 'zod';

const DATABASE_TYPES = ['POSTGRESQL', 'MYSQL', 'SQLITE', 'SQLSERVER', 'OTHER'];

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Workspace name is required' })
      .min(1, 'Workspace name cannot be empty')
      .max(100, 'Workspace name must not exceed 100 characters')
      .trim(),
    description: z
      .string()
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .optional(),
    databaseType: z
      .enum(DATABASE_TYPES, {
        errorMap: () => ({ message: `Database type must be one of: ${DATABASE_TYPES.join(', ')}` }),
      })
      .optional()
      .default('POSTGRESQL'),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Workspace name cannot be empty')
      .max(100, 'Workspace name must not exceed 100 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .nullable()
      .optional(),
    databaseType: z
      .enum(DATABASE_TYPES, {
        errorMap: () => ({ message: `Database type must be one of: ${DATABASE_TYPES.join(', ')}` }),
      })
      .optional(),
  }),
});
