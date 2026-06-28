import prisma from '../config/db.js';
import { getTable } from './table.service.js';

/**
 * Create a new column in a table.
 * Verifies table ownership and column name uniqueness within the table.
 */
export async function createColumn(tableId, userId, { name, dataType, nullable, primaryKey, unique, defaultValue }) {
  // 1. Verify table existence and ownership
  await getTable(tableId, userId);

  // 2. Check for duplicate column name within this table
  const existingColumn = await prisma.column.findUnique({
    where: {
      tableId_name: {
        tableId,
        name,
      },
    },
  });

  if (existingColumn) {
    const error = new Error(`Column with name "${name}" already exists in this table.`);
    error.status = 409; // Conflict
    throw error;
  }

  // 3. Create the column
  const column = await prisma.column.create({
    data: {
      tableId,
      name,
      dataType,
      nullable,
      primaryKey,
      unique,
      defaultValue,
    },
  });

  return column;
}

/**
 * List all columns in a table.
 * Verifies table ownership.
 */
export async function listTableColumns(tableId, userId) {
  await getTable(tableId, userId);

  const columns = await prisma.column.findMany({
    where: { tableId },
    orderBy: { createdAt: 'asc' },
  });

  return columns;
}

/**
 * Get a single column by ID.
 * Verifies that the column exists and belongs to a table/workspace owned by the user.
 */
export async function getColumn(columnId, userId) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: {
      table: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!column) {
    const error = new Error('Column not found');
    error.status = 404;
    throw error;
  }

  if (column.table.workspace.userId !== userId) {
    const error = new Error('Access denied. You do not own this workspace.');
    error.status = 403;
    throw error;
  }

  // Strip include hierarchy
  const { table, ...columnData } = column;
  return columnData;
}

/**
 * Update a column by ID.
 * Verifies ownership and name uniqueness if changed.
 */
export async function updateColumn(columnId, userId, { name, dataType, nullable, primaryKey, unique, defaultValue }) {
  const column = await getColumn(columnId, userId);

  if (name && name !== column.name) {
    const existingColumn = await prisma.column.findUnique({
      where: {
        tableId_name: {
          tableId: column.tableId,
          name,
        },
      },
    });

    if (existingColumn) {
      const error = new Error(`Column with name "${name}" already exists in this table.`);
      error.status = 409;
      throw error;
    }
  }

  const updatedColumn = await prisma.column.update({
    where: { id: columnId },
    data: {
      name,
      dataType,
      nullable,
      primaryKey,
      unique,
      defaultValue,
    },
  });

  return updatedColumn;
}

/**
 * Delete a column by ID.
 * Verifies ownership and cascades logically.
 */
export async function deleteColumn(columnId, userId) {
  await getColumn(columnId, userId);

  await prisma.column.delete({
    where: { id: columnId },
  });

  return { id: columnId };
}
