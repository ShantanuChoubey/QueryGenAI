import { describe, test, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { signToken } from '../../src/utils/jwt.js';

// Mock external Gemini service
vi.mock('../../src/services/gemini.service.js', () => ({
  callGemini: vi.fn(),
}));

// ─── Shared in-memory tables store for mock ───────────────────────────────────
const { mockTables, mockTableIdMap } = vi.hoisted(() => {
  const mockTables = [{ id: 'table-users', name: 'Users', workspaceId: 'test-workspace-id' }];
  const mockTableIdMap = new Map([['users', 'table-users']]);
  return { mockTables, mockTableIdMap };
});

// Mock Prisma
vi.mock('../../src/config/db.js', () => {
  const mockWorkspace = {
    id: 'test-workspace-id',
    name: 'Import Workspace',
    userId: 'test-user-id',
    databaseType: 'POSTGRESQL',
  };

  // User records returned by protect middleware (prisma.user.findUnique)
  const mockUsers = {
    'test-user-id': {
      id: 'test-user-id',
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'USER',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'other-user-id': {
      id: 'other-user-id',
      fullName: 'Other User',
      email: 'other@example.com',
      role: 'USER',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  // Build a re-usable tx mock that mirrors the full client
  const makeTx = () => ({
    workspace: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === 'test-workspace-id') return Promise.resolve(mockWorkspace);
        if (where.id === 'other-workspace-id') return Promise.resolve({ ...mockWorkspace, id: 'other-workspace-id', userId: 'other-user' });
        return Promise.resolve(null);
      }),
    },
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(mockUsers[where.id] ?? null);
      }),
    },
    table: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(mockTables)),
      create: vi.fn().mockImplementation(({ data }) => {
        const newTable = { id: `table-${data.name.toLowerCase()}`, ...data };
        mockTables.push(newTable);
        mockTableIdMap.set(data.name.toLowerCase(), newTable.id);
        return Promise.resolve(newTable);
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        const idx = mockTables.findIndex(t => t.id === where.id);
        if (idx !== -1) {
          const [removed] = mockTables.splice(idx, 1);
          mockTableIdMap.delete(removed.name.toLowerCase());
        }
        return Promise.resolve({ id: where.id });
      }),
    },
    column: {
      count: vi.fn().mockResolvedValue(0),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve({ id: `col-${where.name}` });
      }),
    },
    relationship: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'rel-1', ...data })),
    },
  });

  const tx = makeTx();

  return {
    default: {
      ...tx,
      $transaction: vi.fn().mockImplementation(async (cb) => cb(tx)),
      $disconnect: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('Schema Import API Integration Tests', () => {
  let authToken;
  let otherUserToken;

  beforeAll(() => {
    vi.clearAllMocks();
    authToken = signToken({ id: 'test-user-id', role: 'USER' });
    otherUserToken = signToken({ id: 'other-user-id', role: 'USER' });
  });

  describe('POST /api/v1/workspaces/:workspaceId/import/sql', () => {
    test('should return 401 when unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/sql');
      expect(res.status).toBe(401);
    });

    test('should return 403 when user does not own workspace', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces/other-workspace-id/import/sql')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('CREATE TABLE dummy(id INT);'), 'schema.sql');
      expect(res.status).toBe(403);
    });

    test('should parse valid SQL and flag table conflict', async () => {
      const sqlContent = `
        CREATE TABLE Users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE
        );
        CREATE TABLE Orders (
          id INT PRIMARY KEY,
          user_id INT REFERENCES Users(id)
        );
      `;
      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/sql')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sqlContent), 'schema.sql');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tables.length).toBe(2);
      expect(res.body.data.relationships.length).toBe(1);

      // Users table should flag conflict since mocked findMany returns Users
      const usersTable = res.body.data.tables.find(t => t.name === 'Users');
      expect(usersTable.conflict).toBe('EXISTS');

      const ordersTable = res.body.data.tables.find(t => t.name === 'Orders');
      expect(ordersTable.conflict).toBe('NONE');
    });

    test('should reject empty SQL files', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/sql')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('   \n  '), 'schema.sql');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('empty');
    });

    test('should reject invalid SQL syntax / validation failure', async () => {
      const sqlContent = `
        CREATE TABLE 123InvalidTable (
          id SERIAL PRIMARY KEY
        );
      `;
      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/sql')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sqlContent), 'schema.sql');

      expect(res.status).toBe(400);
      expect(res.body.error.error).toBe('ValidationError');
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/import/json', () => {
    test('should parse valid JSON structure', async () => {
      const jsonContent = JSON.stringify({
        tables: [
          {
            name: 'Products',
            columns: [
              { name: 'id', type: 'INTEGER', primaryKey: true },
              { name: 'name', type: 'VARCHAR', nullable: false }
            ]
          }
        ],
        relationships: []
      });

      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/json')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(jsonContent), 'schema.json');

      expect(res.status).toBe(200);
      expect(res.body.data.tables[0].name).toBe('Products');
    });

    test('should reject malformed JSON', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/json')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('{invalid_json'), 'schema.json');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/import/csv', () => {
    test('should parse valid CSV format', async () => {
      const csvContent = [
        'tableName,columnName,dataType,nullable,primaryKey,unique,defaultValue,referencedTable,referencedColumn',
        'Customers,id,INTEGER,false,true,true,,,',
        'Customers,email,VARCHAR,false,false,true,,,'
      ].join('\n');

      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'schema.csv');

      expect(res.status).toBe(200);
      expect(res.body.data.tables.length).toBe(1);
      expect(res.body.data.tables[0].name).toBe('Customers');
      expect(res.body.data.tables[0].columns.length).toBe(2);
    });

    test('should reject CSV missing required headers', async () => {
      const csvContent = [
        'tableName,columnName,wrongHeader',
        'Customers,id,INTEGER'
      ].join('\n');

      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'schema.csv');

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/import/confirm', () => {
    test('should successfully import schema and run transaction', async () => {
      const payload = {
        tables: [
          {
            name: 'NewTable',
            columns: [
              { name: 'id', dataType: 'INTEGER', primaryKey: true, nullable: false }
            ]
          }
        ],
        relationships: [],
        conflictStrategy: 'SKIP'
      };

      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.tablesCreated).toBe(1);
    });

    test('should handle REPLACE conflict strategy correctly', async () => {
      const payload = {
        tables: [
          {
            name: 'Users', // Users already exists in mock findMany
            columns: [
              { name: 'id', dataType: 'INTEGER', primaryKey: true, nullable: false }
            ]
          }
        ],
        relationships: [],
        conflictStrategy: 'REPLACE'
      };

      const res = await request(app)
        .post('/api/v1/workspaces/test-workspace-id/import/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.tablesReplaced).toBe(1);
    });
  });
});
