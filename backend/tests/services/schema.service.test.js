import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as tableService from '../../src/services/table.service.js';
import * as columnService from '../../src/services/column.service.js';
import * as relationshipService from '../../src/services/relationship.service.js';
import * as workspaceService from '../../src/services/workspace.service.js';
import prisma from '../../src/config/db.js';

vi.mock('../../src/config/db.js', () => ({
  default: {
    workspace: {
      findUnique: vi.fn(),
    },
    table: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    column: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    relationship: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../src/services/workspace.service.js', () => ({
  getWorkspace: vi.fn().mockResolvedValue({ id: 'workspace-1', userId: 'user-1' }),
}));

describe('Schema Builder Services', () => {
  const userId = 'user-1';
  const workspaceId = 'workspace-1';
  const tableId = 'table-1';
  const columnId = 'column-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Table Service Tests ─────────────────────────────────────────────────────
  describe('Table Service', () => {
    test('should create table when unique within workspace', async () => {
      prisma.table.findUnique.mockResolvedValueOnce(null);
      prisma.table.create.mockResolvedValueOnce({ id: tableId, name: 'users', workspaceId });

      const result = await tableService.createTable(workspaceId, userId, { name: 'users' });
      expect(result.name).toBe('users');
    });

    test('should throw 409 conflict on duplicate table name', async () => {
      prisma.table.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(tableService.createTable(workspaceId, userId, { name: 'users' }))
        .rejects.toThrow('already exists in this workspace');
    });
  });

  // ── Column Service Tests ────────────────────────────────────────────────────
  describe('Column Service', () => {
    test('should create column successfully', async () => {
      // Mock table ownership verify
      prisma.table.findUnique.mockResolvedValueOnce({ id: tableId, workspaceId, workspace: { userId } });
      prisma.column.findUnique.mockResolvedValueOnce(null);
      prisma.column.create.mockResolvedValueOnce({ id: columnId, name: 'email', dataType: 'TEXT', tableId });

      const result = await columnService.createColumn(tableId, userId, { name: 'email', dataType: 'TEXT' });
      expect(result.name).toBe('email');
    });

    test('should throw 409 conflict on duplicate column name in same table', async () => {
      prisma.table.findUnique.mockResolvedValueOnce({ id: tableId, workspaceId, workspace: { userId } });
      prisma.column.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(columnService.createColumn(tableId, userId, { name: 'email', dataType: 'TEXT' }))
        .rejects.toThrow('already exists in this table');
    });
  });

  // ── Relationship Service Tests ──────────────────────────────────────────────
  describe('Relationship Service', () => {
    test('should throw 400 when source and target tables belong to different workspaces', async () => {
      prisma.table.findUnique
        .mockResolvedValueOnce({ id: 'source', workspaceId: 'w1', columns: [{ id: 'col1' }] })
        .mockResolvedValueOnce({ id: 'target', workspaceId: 'w2', columns: [{ id: 'col2' }] });

      await expect(relationshipService.createRelationship(userId, {
        sourceTableId: 'source',
        sourceColumnId: 'col1',
        targetTableId: 'target',
        targetColumnId: 'col2',
      })).rejects.toThrow('belong to the same workspace');
    });

    test('should throw 404 when column does not exist on referenced table', async () => {
      prisma.table.findUnique
        .mockResolvedValueOnce({ id: 'source', workspaceId, columns: [{ id: 'col1' }] })
        .mockResolvedValueOnce({ id: 'target', workspaceId, columns: [{ id: 'other' }] });

      await expect(relationshipService.createRelationship(userId, {
        sourceTableId: 'source',
        sourceColumnId: 'col1',
        targetTableId: 'target',
        targetColumnId: 'invalid-col',
      })).rejects.toThrow('column not found on the specified table');
    });
  });
});
