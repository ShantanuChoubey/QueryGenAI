import { describe, test, expect, vi, beforeEach } from 'vitest';
import { generateSchemaContext } from '../../src/services/schemaContext.service.js';

// ── Mock prisma ───────────────────────────────────────────────────────────────
vi.mock('../../src/config/db.js', () => ({
  default: {
    workspace: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from '../../src/config/db.js';

// ── Sample Fixture ────────────────────────────────────────────────────────────
const WORKSPACE_ID = 'ws-1234';

const makeWorkspaceFixture = (overrides = {}) => ({
  id: WORKSPACE_ID,
  name: 'Employee Management',
  databaseType: 'POSTGRESQL',
  userId: 'user-1',
  tables: [
    {
      id: 't1',
      workspaceId: WORKSPACE_ID,
      name: 'employees',
      description: 'All company employees',
      columns: [
        {
          id: 'c1',
          tableId: 't1',
          name: 'id',
          dataType: 'UUID',
          nullable: false,
          primaryKey: true,
          unique: true,
          defaultValue: null,
        },
        {
          id: 'c2',
          tableId: 't1',
          name: 'full_name',
          dataType: 'TEXT',
          nullable: false,
          primaryKey: false,
          unique: false,
          defaultValue: null,
        },
        {
          id: 'c3',
          tableId: 't1',
          name: 'department_id',
          dataType: 'UUID',
          nullable: true,
          primaryKey: false,
          unique: false,
          defaultValue: null,
        },
      ],
    },
    {
      id: 't2',
      workspaceId: WORKSPACE_ID,
      name: 'departments',
      description: null,
      columns: [
        {
          id: 'c4',
          tableId: 't2',
          name: 'id',
          dataType: 'UUID',
          nullable: false,
          primaryKey: true,
          unique: true,
          defaultValue: null,
        },
        {
          id: 'c5',
          tableId: 't2',
          name: 'name',
          dataType: 'TEXT',
          nullable: false,
          primaryKey: false,
          unique: false,
          defaultValue: null,
        },
      ],
    },
  ],
  relationships: [
    {
      id: 'r1',
      workspaceId: WORKSPACE_ID,
      sourceTableId: 't1',
      sourceColumnId: 'c3',
      targetTableId: 't2',
      targetColumnId: 'c4',
      relationshipType: 'MANY_TO_ONE',
      createdAt: new Date(),
      sourceTable: { id: 't1', name: 'employees' },
      sourceColumn: { id: 'c3', name: 'department_id' },
      targetTable: { id: 't2', name: 'departments' },
      targetColumn: { id: 'c4', name: 'id' },
    },
  ],
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('schemaContext.service.js — generateSchemaContext', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns null if workspace is not found', async () => {
    prisma.workspace.findUnique.mockResolvedValue(null);
    const result = await generateSchemaContext('nonexistent-id');
    expect(result).toBeNull();
  });

  test('returns structured schema context with workspace metadata', async () => {
    prisma.workspace.findUnique.mockResolvedValue(makeWorkspaceFixture());
    const ctx = await generateSchemaContext(WORKSPACE_ID);

    expect(ctx).toBeTruthy();
    expect(ctx.workspaceName).toBe('Employee Management');
    expect(ctx.databaseType).toBe('POSTGRESQL');
  });

  test('returns tables with correct column structure', async () => {
    prisma.workspace.findUnique.mockResolvedValue(makeWorkspaceFixture());
    const ctx = await generateSchemaContext(WORKSPACE_ID);

    expect(ctx.tables).toHaveLength(2);
    const empTable = ctx.tables.find((t) => t.name === 'employees');
    expect(empTable).toBeTruthy();
    expect(empTable.columns).toHaveLength(3);
    expect(empTable.columns[0]).toMatchObject({
      name: 'id',
      dataType: 'UUID',
      primaryKey: true,
      nullable: false,
      unique: true,
    });
  });

  test('includes description on tables where provided', async () => {
    prisma.workspace.findUnique.mockResolvedValue(makeWorkspaceFixture());
    const ctx = await generateSchemaContext(WORKSPACE_ID);

    const empTable = ctx.tables.find((t) => t.name === 'employees');
    expect(empTable.description).toBe('All company employees');
    const deptTable = ctx.tables.find((t) => t.name === 'departments');
    expect(deptTable.description).toBeUndefined(); // null stripped
  });

  test('returns relationships with resolved names', async () => {
    prisma.workspace.findUnique.mockResolvedValue(makeWorkspaceFixture());
    const ctx = await generateSchemaContext(WORKSPACE_ID);

    expect(ctx.relationships).toHaveLength(1);
    expect(ctx.relationships[0]).toMatchObject({
      sourceTable: 'employees',
      sourceColumn: 'department_id',
      targetTable: 'departments',
      targetColumn: 'id',
      relationshipType: 'MANY_TO_ONE',
    });
  });

  test('returns empty arrays if workspace has no tables', async () => {
    prisma.workspace.findUnique.mockResolvedValue(
      makeWorkspaceFixture({ tables: [], relationships: [] })
    );
    const ctx = await generateSchemaContext(WORKSPACE_ID);

    expect(ctx.tables).toHaveLength(0);
    expect(ctx.relationships).toHaveLength(0);
  });

  test('passes correct includes to prisma.workspace.findUnique', async () => {
    prisma.workspace.findUnique.mockResolvedValue(makeWorkspaceFixture());
    await generateSchemaContext(WORKSPACE_ID);

    expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
      where: { id: WORKSPACE_ID },
      include: expect.objectContaining({
        tables: expect.anything(),
        relationships: expect.anything(),
      }),
    });
  });
});
