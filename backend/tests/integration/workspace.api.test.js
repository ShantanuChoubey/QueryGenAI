import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { signToken } from '../../src/utils/jwt.js';

// Mock external Gemini service to prevent resolving and loading @google/generative-ai
vi.mock('../../src/services/gemini.service.js', () => ({
  callGemini: vi.fn(),
}));

// Mock the auth middleware's DB lookup and the workspace actions
vi.mock('../../src/config/db.js', () => ({
  default: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'test-user-id',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
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
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

import prisma from '../../src/config/db.js';

describe('Workspace API Integration Tests', () => {
  let authToken;

  beforeAll(() => {
    vi.clearAllMocks();
    authToken = signToken({ id: 'test-user-id', role: 'USER' });
  });

  describe('POST /api/v1/workspaces', () => {
    test('should successfully create workspace', async () => {
      const mockWorkspace = {
        id: 'workspace-1',
        name: 'Inventory System',
        description: 'Track items',
        databaseType: 'POSTGRESQL',
        userId: 'test-user-id',
      };

      prisma.workspace.create.mockResolvedValueOnce(mockWorkspace);

      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Inventory System',
          description: 'Track items',
          databaseType: 'POSTGRESQL',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockWorkspace);
    });

    test('should fail validation when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'No name',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('ValidationError');
    });

    test('should fail validation on invalid database type', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid DB',
          databaseType: 'INVALID_DB_TYPE',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/workspaces', () => {
    test('should list all workspaces for user', async () => {
      const mockWorkspaces = [
        { id: '1', name: 'W1', userId: 'test-user-id' },
      ];
      prisma.workspace.findMany.mockResolvedValueOnce(mockWorkspaces);

      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockWorkspaces);
    });
  });

  describe('GET /api/v1/workspaces/:id', () => {
    test('should return workspace details if owned by user', async () => {
      const mockWorkspace = { id: 'workspace-1', name: 'W1', userId: 'test-user-id' };
      prisma.workspace.findUnique.mockResolvedValueOnce(mockWorkspace);

      const res = await request(app)
        .get('/api/v1/workspaces/workspace-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockWorkspace);
    });

    test('should deny access if not owned by user', async () => {
      const mockWorkspace = { id: 'workspace-1', name: 'W1', userId: 'other-user' };
      prisma.workspace.findUnique.mockResolvedValueOnce(mockWorkspace);

      const res = await request(app)
        .get('/api/v1/workspaces/workspace-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
