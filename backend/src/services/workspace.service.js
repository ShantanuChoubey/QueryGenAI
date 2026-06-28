import prisma from '../config/db.js';

/**
 * Create a new workspace for a user.
 */
export async function createWorkspace(userId, { name, description, databaseType }) {
  const workspace = await prisma.workspace.create({
    data: {
      name,
      description,
      databaseType,
      userId,
    },
  });
  return workspace;
}

/**
 * List all workspaces belonging to a user.
 */
export async function listUserWorkspaces(userId) {
  const workspaces = await prisma.workspace.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return workspaces;
}

/**
 * Get a single workspace by ID with ownership verification.
 */
export async function getWorkspace(workspaceId, userId) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    const error = new Error('Workspace not found');
    error.status = 404;
    throw error;
  }

  if (workspace.userId !== userId) {
    const error = new Error('Access denied. You do not own this workspace.');
    error.status = 403;
    throw error;
  }

  return workspace;
}

/**
 * Update an existing workspace with ownership verification.
 */
export async function updateWorkspace(workspaceId, userId, { name, description, databaseType }) {
  // First verify existence and ownership
  await getWorkspace(workspaceId, userId);

  const updatedWorkspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name,
      description,
      databaseType,
    },
  });

  return updatedWorkspace;
}

/**
 * Delete a workspace with ownership verification.
 */
export async function deleteWorkspace(workspaceId, userId) {
  // First verify existence and ownership
  await getWorkspace(workspaceId, userId);

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  return { id: workspaceId };
}
