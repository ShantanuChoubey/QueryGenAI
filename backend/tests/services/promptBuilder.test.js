import { describe, test, expect } from 'vitest';
import { buildPrompt } from '../../src/services/promptBuilder.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SCHEMA_CONTEXT = {
  workspaceName: 'Employee Management',
  databaseType: 'POSTGRESQL',
  tables: [
    {
      name: 'employees',
      description: 'All company employees',
      columns: [
        { name: 'id', dataType: 'UUID', primaryKey: true, unique: true, nullable: false, defaultValue: null },
        { name: 'full_name', dataType: 'TEXT', primaryKey: false, unique: false, nullable: false, defaultValue: null },
        { name: 'department_id', dataType: 'UUID', primaryKey: false, unique: false, nullable: true, defaultValue: null },
      ],
    },
    {
      name: 'departments',
      description: undefined,
      columns: [
        { name: 'id', dataType: 'UUID', primaryKey: true, unique: true, nullable: false, defaultValue: null },
        { name: 'name', dataType: 'TEXT', primaryKey: false, unique: false, nullable: false, defaultValue: null },
      ],
    },
  ],
  relationships: [
    {
      sourceTable: 'employees',
      sourceColumn: 'department_id',
      targetTable: 'departments',
      targetColumn: 'id',
      relationshipType: 'MANY_TO_ONE',
    },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('promptBuilder.js — buildPrompt', () => {
  test('uses schema context when provided', () => {
    const prompt = buildPrompt('List all employees', SCHEMA_CONTEXT, null);
    expect(prompt).toContain('Employee Management');
    expect(prompt).toContain('POSTGRESQL');
    expect(prompt).toContain('employees');
    expect(prompt).toContain('departments');
    expect(prompt).toContain('MANY_TO_ONE');
  });

  test('includes column attributes in schema context prompt', () => {
    const prompt = buildPrompt('List employees', SCHEMA_CONTEXT, null);
    expect(prompt).toContain('id');
    expect(prompt).toContain('UUID');
    expect(prompt).toContain('PRIMARY KEY');
  });

  test('includes user request in prompt', () => {
    const userRequest = 'Show all employees with their department name';
    const prompt = buildPrompt(userRequest, SCHEMA_CONTEXT, null);
    expect(prompt).toContain(userRequest);
  });

  test('falls back to static schema when schemaContext is null', () => {
    const fallback = {
      User: { tableName: 'user', columns: [{ name: 'id', dataType: 'String' }], relationships: [] },
    };
    const prompt = buildPrompt('get all users', null, fallback);
    expect(prompt).toContain('DATABASE SCHEMA CONTEXT');
    expect(prompt).toContain(JSON.stringify(fallback, null, 2));
  });

  test('falls back gracefully with empty/null static schema', () => {
    const prompt = buildPrompt('test request', null, null);
    expect(prompt).toContain('DATABASE SCHEMA CONTEXT');
    expect(prompt).toContain('{}');
  });

  test('prompt includes JSON response format instruction', () => {
    const prompt = buildPrompt('find users', SCHEMA_CONTEXT, null);
    expect(prompt).toContain('"queries"');
    expect(prompt).toContain('"sql"');
    expect(prompt).toContain('"explanation"');
    expect(prompt).toContain('"ranking"');
  });

  test('prompt disallows data-modification statements', () => {
    const prompt = buildPrompt('show me data', SCHEMA_CONTEXT, null);
    expect(prompt).toMatch(/never.*INSERT|never.*UPDATE|never.*DELETE/i);
  });

  test('schema context prompt mentions relationships section', () => {
    const prompt = buildPrompt('get department employees', SCHEMA_CONTEXT, null);
    expect(prompt).toContain('RELATIONSHIPS');
    expect(prompt).toContain('employees.department_id');
    expect(prompt).toContain('departments.id');
  });

  test('handles workspace with no relationships', () => {
    const ctx = { ...SCHEMA_CONTEXT, relationships: [] };
    const prompt = buildPrompt('get employees', ctx, null);
    expect(prompt).toContain('No foreign keys configured');
  });

  test('handles workspace with no tables', () => {
    const ctx = { ...SCHEMA_CONTEXT, tables: [] };
    const prompt = buildPrompt('get data', ctx, null);
    expect(prompt).toContain('No tables defined in workspace');
  });
});
