import { z } from 'zod';

export const createSavedQuerySchema = z.object({
  body: z.object({
    workspaceId: z
      .string({ required_error: 'Workspace ID is required' })
      .uuid({ message: 'Workspace ID must be a valid UUID' }),
    title: z
      .string({ required_error: 'Title is required' })
      .min(1, 'Title cannot be empty')
      .max(200, 'Title must not exceed 200 characters')
      .trim(),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .trim()
      .optional(),
    naturalLanguagePrompt: z
      .string({ required_error: 'Natural language prompt is required' })
      .min(1, 'Prompt cannot be empty')
      .trim(),
    generatedSQL: z
      .string({ required_error: 'Generated SQL is required' })
      .min(1, 'SQL cannot be empty')
      .trim(),
    tags: z
      .array(z.string().max(50, 'Tag too long').trim())
      .max(10, 'Cannot add more than 10 tags')
      .optional()
      .default([]),
  }),
});

export const updateSavedQuerySchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title must not exceed 200 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .trim()
      .nullable()
      .optional(),
    tags: z
      .array(z.string().max(50, 'Tag too long').trim())
      .max(10, 'Cannot add more than 10 tags')
      .optional(),
  }),
});
