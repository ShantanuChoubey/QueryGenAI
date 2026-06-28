import { z } from 'zod';

const DATA_TYPES = [
  'TEXT', 'VARCHAR', 'INTEGER', 'BIGINT', 'DECIMAL', 'BOOLEAN',
  'DATE', 'TIMESTAMP', 'UUID', 'JSON', 'FLOAT', 'DOUBLE',
  'SERIAL', 'BIGSERIAL'
];

const RELATIONSHIP_TYPES = ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'];

// ── Table Validation ──────────────────────────────────────────────────────────

export const createTableSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Table name is required' })
      .min(1, 'Table name cannot be empty')
      .max(63, 'Table name must not exceed 63 characters')
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Table name must start with a letter or underscore and contain only alphanumeric characters and underscores')
      .trim(),
    description: z
      .string()
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .optional(),
  }),
});

export const updateTableSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Table name cannot be empty')
      .max(63, 'Table name must not exceed 63 characters')
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Table name must start with a letter or underscore and contain only alphanumeric characters and underscores')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .nullable()
      .optional(),
  }),
});

// ── Column Validation ─────────────────────────────────────────────────────────

export const createColumnSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Column name is required' })
      .min(1, 'Column name cannot be empty')
      .max(63, 'Column name must not exceed 63 characters')
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Column name must start with a letter or underscore and contain only alphanumeric characters and underscores')
      .trim(),
    dataType: z
      .string({ required_error: 'Data type is required' })
      .refine((val) => DATA_TYPES.includes(val.toUpperCase()), {
        message: `Data type must be one of: ${DATA_TYPES.join(', ')}`,
      })
      .transform((val) => val.toUpperCase()),
    nullable: z.boolean().optional().default(true),
    primaryKey: z.boolean().optional().default(false),
    unique: z.boolean().optional().default(false),
    defaultValue: z.string().max(255).trim().nullable().optional(),
  }),
});

export const updateColumnSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Column name cannot be empty')
      .max(63, 'Column name must not exceed 63 characters')
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Column name must start with a letter or underscore and contain only alphanumeric characters and underscores')
      .trim()
      .optional(),
    dataType: z
      .string()
      .refine((val) => DATA_TYPES.includes(val.toUpperCase()), {
        message: `Data type must be one of: ${DATA_TYPES.join(', ')}`,
      })
      .transform((val) => val.toUpperCase())
      .optional(),
    nullable: z.boolean().optional(),
    primaryKey: z.boolean().optional(),
    unique: z.boolean().optional(),
    defaultValue: z.string().max(255).trim().nullable().optional(),
  }),
});

// ── Relationship Validation ───────────────────────────────────────────────────

export const createRelationshipSchema = z.object({
  body: z.object({
    sourceTableId: z
      .string({ required_error: 'Source table ID is required' })
      .uuid('sourceTableId must be a valid UUID'),
    sourceColumnId: z
      .string({ required_error: 'Source column ID is required' })
      .uuid('sourceColumnId must be a valid UUID'),
    targetTableId: z
      .string({ required_error: 'Target table ID is required' })
      .uuid('targetTableId must be a valid UUID'),
    targetColumnId: z
      .string({ required_error: 'Target column ID is required' })
      .uuid('targetColumnId must be a valid UUID'),
    relationshipType: z
      .enum(RELATIONSHIP_TYPES, {
        errorMap: () => ({ message: `relationshipType must be one of: ${RELATIONSHIP_TYPES.join(', ')}` }),
      })
      .optional()
      .default('ONE_TO_MANY'),
  }),
});

export const updateRelationshipSchema = z.object({
  body: z.object({
    sourceTableId: z.string().uuid('sourceTableId must be a valid UUID').optional(),
    sourceColumnId: z.string().uuid('sourceColumnId must be a valid UUID').optional(),
    targetTableId: z.string().uuid('targetTableId must be a valid UUID').optional(),
    targetColumnId: z.string().uuid('targetColumnId must be a valid UUID').optional(),
    relationshipType: z
      .enum(RELATIONSHIP_TYPES, {
        errorMap: () => ({ message: `relationshipType must be one of: ${RELATIONSHIP_TYPES.join(', ')}` }),
      })
      .optional(),
  }),
});
