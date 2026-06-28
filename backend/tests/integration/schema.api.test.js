import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { signToken } from '../../src/utils/jwt.js';

// Mock external Gemini service to prevent resolving and loading @google/generative-ai
vi.mock('../../src/services/gemini.service.js', () => ({
  callGemini: vi.fn(),
}));

// Mock the auth middleware's DB lookup and the prisma actions
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
      findUnique: vi.fn().mockResolvedValue({ id: 'workspace-1', userId: 'test-user-id' }),
    },
    table: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    column: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    relationship: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

import prisma from '../../src/config/db.js';

describe('Schema Builder API Integration Tests', () => {
  let authToken;

  beforeAll(() => {
    vi.clearAllMocks();
    authToken = signToken({ id: 'test-user-id', role: 'USER' });
  });

  describe('POST /api/v1/workspaces/:workspaceId/tables', () => {
    test('should successfully create table', async () => {
      const mockTable = {
        id: 'table-1',
        name: 'orders',
        workspaceId: 'workspace-1',
      };

      prisma.table.findUnique.mockResolvedValueOnce(null);
      prisma.table.create.mockResolvedValueOnce(mockTable);

      const res = await request(app)
        .post('/api/v1/workspaces/workspace-1/tables')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'orders',
          description: 'Tracks customer orders',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTable);
    });

    test('should fail validation when name starts with a number', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces/workspace-1/tables')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '123orders',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.error).toBe('ValidationError');
    });
  });

  describe('POST /api/v1/tables/:tableId/columns', () => {
    test('should successfully create column', async () => {
      const mockColumn = {
        id: 'column-1',
        name: 'total_amount',
        dataType: 'DECIMAL',
        tableId: 'table-1',
      };

      prisma.table.findUnique.mockResolvedValueOnce({
        id: 'table-1',
        workspaceId: 'workspace-1',
        workspace: { userId: 'test-user-id' },
      });
      prisma.column.findUnique.mockResolvedValueOnce(null);
      prisma.column.create.mockResolvedValueOnce(mockColumn);

      const res = await request(app)
        .post('/api/v1/tables/table-1/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'total_amount',
          dataType: 'DECIMAL',
          nullable: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockColumn);
    });

    test('should fail validation when data type is unsupported', async () => {
      const res = await request(app)
        .post('/api/v1/tables/table-1/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'amount',
          dataType: 'UNSUPPORTED_TYPE',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
