import prisma from '../config/db.js';
import { getWorkspace } from './workspace.service.js';

/**
 * Create a new table within a workspace.
 * Verifies workspace ownership and name uniqueness.
 */
export async function createTable(workspaceId, userId, { name, description }) {
  // 1. Verify workspace existence and ownership
  await getWorkspace(workspaceId, userId);

  // 2. Check for duplicate table name in this workspace
  const existingTable = await prisma.table.findUnique({
    where: {
      workspaceId_name: {
        workspaceId,
        name,
      },
    },
  });

  if (existingTable) {
    const error = new Error(`Table with name "${name}" already exists in this workspace.`);
    error.status = 409; // Conflict
    throw error;
  }

  // 3. Create the table
  const table = await prisma.table.create({
    data: {
      workspaceId,
      name,
      description,
    },
  });

  return table;
}

/**
 * List all tables in a workspace.
 * Verifies workspace ownership.
 */
export async function listWorkspaceTables(workspaceId, userId) {
  await getWorkspace(workspaceId, userId);

  const tables = await prisma.table.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
  });

  return tables;
}

/**
 * Get a single table by ID.
 * Verifies that the table exists and belongs to a workspace owned by the user.
 */
export async function getTable(tableId, userId) {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { workspace: true },
  });

  if (!table) {
    const error = new Error('Table not found');
    error.status = 404;
    throw error;
  }

  if (table.workspace.userId !== userId) {
    const error = new Error('Access denied. You do not own this workspace.');
    error.status = 403;
    throw error;
  }

  // Strip include workspace properties for return value consistency
  const { workspace, ...tableData } = table;
  return tableData;
}

/**
 * Update an existing table by ID.
 * Verifies ownership and name uniqueness if changed.
 */
export async function updateTable(tableId, userId, { name, description }) {
  const table = await getTable(tableId, userId);

  if (name && name !== table.name) {
    const existingTable = await prisma.table.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: table.workspaceId,
          name,
        },
      },
    });

    if (existingTable) {
      const error = new Error(`Table with name "${name}" already exists in this workspace.`);
      error.status = 409;
      throw error;
    }
  }

  const updatedTable = await prisma.table.update({
    where: { id: tableId },
    data: {
      name,
      description,
    },
  });

  return updatedTable;
}

/**
 * Delete a table by ID.
 * Verifies ownership and cascades logically.
 */
export async function deleteTable(tableId, userId) {
  await getTable(tableId, userId);

  await prisma.table.delete({
    where: { id: tableId },
  });

  return { id: tableId };
}
