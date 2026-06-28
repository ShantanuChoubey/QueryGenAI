import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as workspaceService from '../../src/services/workspace.service.js';
import prisma from '../../src/config/db.js';

vi.mock('../../src/config/db.js', () => ({
  default: {
    workspace: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    table: {
      count: vi.fn().mockResolvedValue(0),
    },
    column: {
      count: vi.fn().mockResolvedValue(0),
    },
    relationship: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

describe('Workspace Service', () => {
  const userId = 'user-123';
  const workspaceId = 'workspace-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWorkspace', () => {
    test('should create a workspace successfully', async () => {
      const mockWorkspace = {
        id: workspaceId,
        name: 'Employee System',
        description: 'Manage employees',
        databaseType: 'POSTGRESQL',
        userId,
      };

      prisma.workspace.create.mockResolvedValueOnce(mockWorkspace);

      const result = await workspaceService.createWorkspace(userId, {
        name: 'Employee System',
        description: 'Manage employees',
        databaseType: 'POSTGRESQL',
      });

      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: 'Employee System',
          description: 'Manage employees',
          databaseType: 'POSTGRESQL',
          userId,
        },
      });
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('listUserWorkspaces', () => {
    test('should return all workspaces for a user', async () => {
      const mockWorkspaces = [
        { id: '1', name: 'W1', userId },
        { id: '2', name: 'W2', userId },
      ];

      prisma.workspace.findMany.mockResolvedValueOnce(mockWorkspaces);

      const result = await workspaceService.listUserWorkspaces(userId);

      expect(prisma.workspace.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('getWorkspace', () => {
    test('should retrieve a workspace if owned by user', async () => {
      const mockWorkspace = { id: workspaceId, name: 'W1', userId };
      prisma.workspace.findUnique.mockResolvedValueOnce(mockWorkspace);

      const result = await workspaceService.getWorkspace(workspaceId, userId);

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(result).toEqual({
        ...mockWorkspace,
        _count: {
          tables: 0,
          columns: 0,
          relationships: 0,
        },
      });
    });

    test('should throw 404 if workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValueOnce(null);

      await expect(workspaceService.getWorkspace(workspaceId, userId))
        .rejects.toThrow('Workspace not found');
    });

    test('should throw 403 if workspace is not owned by user', async () => {
      const mockWorkspace = { id: workspaceId, name: 'W1', userId: 'other-user' };
      prisma.workspace.findUnique.mockResolvedValueOnce(mockWorkspace);

      await expect(workspaceService.getWorkspace(workspaceId, userId))
        .rejects.toThrow('Access denied. You do not own this workspace.');
    });
  });

  describe('updateWorkspace', () => {
    test('should update a workspace if owned by user', async () => {
      const mockWorkspace = { id: workspaceId, name: 'W1', userId };
      prisma.workspace.findUnique.mockResolvedValueOnce(mockWorkspace);
      prisma.workspace.update.mockResolvedValueOnce({ ...mockWorkspace, name: 'Updated W1' });

      const result = await workspaceService.updateWorkspace(workspaceId, userId, {
        name: 'Updated W1',
      });

      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: workspaceId },
        data: { name: 'Updated W1' },
      });
      expect(result.name).toBe('Updated W1');
    });
  });

  describe('deleteWorkspace', () => {
    test('should delete a workspace if owned by user', async () => {
      const mockWorkspace = { id: workspaceId, name: 'W1', userId };
      prisma.workspace.findUnique.mockResolvedValueOnce(mockWorkspace);
      prisma.workspace.delete.mockResolvedValueOnce(mockWorkspace);

      const result = await workspaceService.deleteWorkspace(workspaceId, userId);

      expect(prisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(result).toEqual({ id: workspaceId });
    });
  });
});
