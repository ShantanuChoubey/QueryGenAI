import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  saveQuery,
  listSavedQueries,
  getSavedQuery,
  updateSavedQuery,
  toggleFavorite,
  deleteSavedQuery,
  searchSavedQueries,
} from '../../src/services/savedQuery.service.js';

// ── Mock prisma ───────────────────────────────────────────────────────────────
vi.mock('../../src/config/db.js', () => ({
  default: {
    savedQuery: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
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

import prisma from '../../src/config/db.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const WORKSPACE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const USER_ID = 'user-0000-0000-0000-000000000001';
const SQ_ID = 'sq-00000-0000-0000-0000-000000000001';

const workspaceFixture = {
  id: WORKSPACE_ID,
  userId: USER_ID,
  name: 'My DB',
  databaseType: 'POSTGRESQL',
};

const sqFixture = {
  id: SQ_ID,
  workspaceId: WORKSPACE_ID,
  userId: USER_ID,
  title: 'All active users',
  description: null,
  naturalLanguagePrompt: 'List all active users',
  generatedSQL: 'SELECT * FROM users WHERE active = true;',
  databaseType: 'POSTGRESQL',
  tags: ['users'],
  isFavorite: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('savedQuery.service.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default workspace ownership mock
    prisma.workspace.findUnique.mockResolvedValue(workspaceFixture);
  });

  // ── saveQuery ──────────────────────────────────────────────────────────────

  describe('saveQuery()', () => {
    test('saves a query and returns the saved record', async () => {
      prisma.savedQuery.findUnique.mockResolvedValue(null); // no duplicate
      prisma.savedQuery.create.mockResolvedValue(sqFixture);

      const result = await saveQuery(USER_ID, {
        workspaceId: WORKSPACE_ID,
        title: 'All active users',
        naturalLanguagePrompt: 'List all active users',
        generatedSQL: 'SELECT * FROM users WHERE active = true;',
        tags: ['users'],
      });

      expect(result).toMatchObject({ title: 'All active users' });
      expect(prisma.savedQuery.create).toHaveBeenCalledOnce();
    });

    test('throws 409 when title already exists in workspace', async () => {
      prisma.savedQuery.findUnique.mockResolvedValue(sqFixture); // duplicate found

      await expect(
        saveQuery(USER_ID, {
          workspaceId: WORKSPACE_ID,
          title: 'All active users',
          naturalLanguagePrompt: 'x',
          generatedSQL: 'SELECT 1;',
        })
      ).rejects.toMatchObject({ status: 409 });
    });

    test('throws 403 when workspace is owned by different user', async () => {
      prisma.workspace.findUnique.mockResolvedValue({ ...workspaceFixture, userId: 'other-user' });

      await expect(
        saveQuery(USER_ID, {
          workspaceId: WORKSPACE_ID,
          title: 'Any title',
          naturalLanguagePrompt: 'x',
          generatedSQL: 'SELECT 1;',
        })
      ).rejects.toMatchObject({ status: 403 });
    });

    test('throws 404 when workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        saveQuery(USER_ID, {
          workspaceId: WORKSPACE_ID,
          title: 'Title',
          naturalLanguagePrompt: 'x',
          generatedSQL: 'SELECT 1;',
        })
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  // ── listSavedQueries ───────────────────────────────────────────────────────

  describe('listSavedQueries()', () => {
    test('returns paginated items', async () => {
      prisma.savedQuery.findMany.mockResolvedValue([sqFixture]);
      prisma.savedQuery.count.mockResolvedValue(1);

      const result = await listSavedQueries(WORKSPACE_ID, USER_ID);

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    test('applies favoritesOnly filter', async () => {
      prisma.savedQuery.findMany.mockResolvedValue([]);
      prisma.savedQuery.count.mockResolvedValue(0);

      await listSavedQueries(WORKSPACE_ID, USER_ID, { favoritesOnly: true });

      const callArgs = prisma.savedQuery.findMany.mock.calls[0][0];
      expect(callArgs.where).toMatchObject({ isFavorite: true });
    });

    test('applies search filter to title and prompt', async () => {
      prisma.savedQuery.findMany.mockResolvedValue([]);
      prisma.savedQuery.count.mockResolvedValue(0);

      await listSavedQueries(WORKSPACE_ID, USER_ID, { search: 'active' });

      const callArgs = prisma.savedQuery.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
    });
  });

  // ── getSavedQuery ──────────────────────────────────────────────────────────

  describe('getSavedQuery()', () => {
    test('returns the saved query for the correct owner', async () => {
      prisma.savedQuery.findUnique.mockResolvedValue(sqFixture);
      const result = await getSavedQuery(SQ_ID, USER_ID);
      expect(result.id).toBe(SQ_ID);
    });

    test('throws 404 when saved query does not exist', async () => {
      prisma.savedQuery.findUnique.mockResolvedValue(null);
      await expect(getSavedQuery(SQ_ID, USER_ID)).rejects.toMatchObject({ status: 404 });
    });

    test('throws 403 when owned by different user', async () => {
      prisma.savedQuery.findUnique.mockResolvedValue({ ...sqFixture, userId: 'other' });
      await expect(getSavedQuery(SQ_ID, USER_ID)).rejects.toMatchObject({ status: 403 });
    });
  });

  // ── updateSavedQuery ───────────────────────────────────────────────────────

  describe('updateSavedQuery()', () => {
    test('updates title, description, and tags', async () => {
      prisma.savedQuery.findUnique
        .mockResolvedValueOnce(sqFixture) // ownership check
        .mockResolvedValueOnce(null);     // duplicate title check (no conflict)
      prisma.savedQuery.update.mockResolvedValue({ ...sqFixture, title: 'Updated title', tags: ['new'] });

      const result = await updateSavedQuery(SQ_ID, USER_ID, { title: 'Updated title', tags: ['new'] });

      expect(result.title).toBe('Updated title');
      expect(prisma.savedQuery.update).toHaveBeenCalledOnce();
    });

    test('throws 409 when new title conflicts with another saved query', async () => {
      prisma.savedQuery.findUnique
        .mockResolvedValueOnce(sqFixture)        // ownership check
        .mockResolvedValueOnce({ ...sqFixture, id: 'other-id', title: 'New Title' }); // conflict

      await expect(
        updateSavedQuery(SQ_ID, USER_ID, { title: 'New Title' })
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  // ── toggleFavorite ─────────────────────────────────────────────────────────

  describe('toggleFavorite()', () => {
    test('flips isFavorite from false to true', async () => {
      prisma.savedQuery.findUnique.mockResolvedValue({ ...sqFixture, isFavorite: false });
      prisma.savedQuery.update.mockResolvedValue({ ...sqFixture, isFavorite: true });

      const result = await toggleFavorite(SQ_ID, USER_ID);
      expect(result.isFavorite).toBe(true);
      expect(prisma.savedQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isFavorite: true } })
      );
    });

    test('flips isFavorite from true to false', async () => {
      prisma.savedQuery.findUnique.mockResolvedValue({ ...sqFixture, isFavorite: true });
      prisma.savedQuery.update.mockResolvedValue({ ...sqFixture, isFavorite: false });

      const result = await toggleFavorite(SQ_ID, USER_ID);
      expect(result.isFavorite).toBe(false);
    });
  });

  // ── deleteSavedQuery ───────────────────────────────────────────────────────

  describe('deleteSavedQuery()', () => {
    test('deletes and returns id', async () => {
      prisma.savedQuery.findUnique.mockResolvedValue(sqFixture);
      prisma.savedQuery.delete.mockResolvedValue(sqFixture);

      const result = await deleteSavedQuery(SQ_ID, USER_ID);
      expect(result).toEqual({ id: SQ_ID });
      expect(prisma.savedQuery.delete).toHaveBeenCalledOnce();
    });

    test('throws 403 if owned by a different user', async () => {
      prisma.savedQuery.findUnique.mockResolvedValue({ ...sqFixture, userId: 'other' });
      await expect(deleteSavedQuery(SQ_ID, USER_ID)).rejects.toMatchObject({ status: 403 });
    });
  });

  // ── searchSavedQueries ─────────────────────────────────────────────────────

  describe('searchSavedQueries()', () => {
    test('returns results matching query', async () => {
      prisma.savedQuery.findMany.mockResolvedValue([sqFixture]);
      const results = await searchSavedQueries(WORKSPACE_ID, USER_ID, 'active');
      expect(results).toHaveLength(1);
      const callArgs = prisma.savedQuery.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
    });

    test('performs workspace isolation check', async () => {
      prisma.workspace.findUnique.mockResolvedValue({ ...workspaceFixture, userId: 'other' });
      await expect(searchSavedQueries(WORKSPACE_ID, USER_ID, 'test')).rejects.toMatchObject({ status: 403 });
    });
  });
});
