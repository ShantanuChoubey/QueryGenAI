import prisma from '../config/db.js';
import { getWorkspace } from './workspace.service.js';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Save a generated SQL query to a workspace.
 */
export async function saveQuery(userId, {
  workspaceId,
  title,
  description,
  naturalLanguagePrompt,
  generatedSQL,
  tags = [],
}) {
  await getWorkspace(workspaceId, userId);

  // Check for duplicate title in workspace
  const existing = await prisma.savedQuery.findUnique({
    where: { workspaceId_title: { workspaceId, title } },
  });
  if (existing) {
    const error = new Error(`A saved query titled "${title}" already exists in this workspace.`);
    error.status = 409;
    throw error;
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

  return prisma.savedQuery.create({
    data: {
      workspaceId,
      userId,
      title,
      description,
      naturalLanguagePrompt,
      generatedSQL,
      databaseType: workspace?.databaseType || 'POSTGRESQL',
      tags,
    },
  });
}

/**
 * List all saved queries for a workspace with optional search and pagination.
 */
export async function listSavedQueries(workspaceId, userId, {
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  search = '',
  favoritesOnly = false,
  sortOrder = 'desc',
} = {}) {
  await getWorkspace(workspaceId, userId);

  const where = {
    workspaceId,
    ...(favoritesOnly ? { isFavorite: true } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { naturalLanguagePrompt: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.savedQuery.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        naturalLanguagePrompt: true,
        databaseType: true,
        tags: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true,
        // Exclude heavy generatedSQL from list — fetch on demand
      },
      orderBy: { createdAt: sortOrder },
      skip,
      take: limit,
    }),
    prisma.savedQuery.count({ where }),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single saved query by ID (includes full SQL).
 */
export async function getSavedQuery(id, userId) {
  const sq = await prisma.savedQuery.findUnique({ where: { id } });

  if (!sq) {
    const error = new Error('Saved query not found');
    error.status = 404;
    throw error;
  }

  if (sq.userId !== userId) {
    const error = new Error('Access denied. You do not own this saved query.');
    error.status = 403;
    throw error;
  }

  return sq;
}

/**
 * Update a saved query's metadata. Ownership validated first.
 */
export async function updateSavedQuery(id, userId, { title, description, tags }) {
  const sq = await getSavedQuery(id, userId);

  // Prevent duplicate title within workspace (if title changed)
  if (title && title !== sq.title) {
    const conflict = await prisma.savedQuery.findUnique({
      where: { workspaceId_title: { workspaceId: sq.workspaceId, title } },
    });
    if (conflict) {
      const error = new Error(`A saved query titled "${title}" already exists in this workspace.`);
      error.status = 409;
      throw error;
    }
  }

  return prisma.savedQuery.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(tags !== undefined ? { tags } : {}),
    },
  });
}

/**
 * Toggle the isFavorite status for a saved query. Also exported as favoriteQuery.
 */
export async function toggleFavorite(id, userId) {
  const sq = await getSavedQuery(id, userId);

  return prisma.savedQuery.update({
    where: { id },
    data: { isFavorite: !sq.isFavorite },
  });
}

export const favoriteQuery = toggleFavorite;


/**
 * Delete a saved query. Ownership validated first.
 */
export async function deleteSavedQuery(id, userId) {
  await getSavedQuery(id, userId);

  await prisma.savedQuery.delete({ where: { id } });
  return { id };
}

/**
 * Full-text search across title, prompt, and tags for a workspace.
 */
export async function searchSavedQueries(workspaceId, userId, query) {
  await getWorkspace(workspaceId, userId);

  return prisma.savedQuery.findMany({
    where: {
      workspaceId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { naturalLanguagePrompt: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      naturalLanguagePrompt: true,
      databaseType: true,
      tags: true,
      isFavorite: true,
      createdAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}
