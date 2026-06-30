import prisma from '../config/db.js';
import { getWorkspace } from './workspace.service.js';

/**
 * Reads workspace schema metadata and structures it for visual ER diagram mapping.
 * Verifies workspace presence and ownership before reading details.
 *
 * @param {string} workspaceId - The UUID of the workspace
 * @param {string} userId - The authenticated user requesting the diagram
 * @returns {Promise<Object>} Diagram structured tables and relationships metadata
 */
export async function getWorkspaceDiagram(workspaceId, userId) {
  // Ownership verification throws 404/403 automatically
  await getWorkspace(workspaceId, userId);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      tables: {
        include: {
          columns: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
      relationships: {
        include: {
          sourceTable: true,
          sourceColumn: true,
          targetTable: true,
          targetColumn: true,
        },
      },
    },
  });

  if (!workspace) {
    const error = new Error('Workspace not found');
    error.status = 404;
    throw error;
  }

  const tables = workspace.tables.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description || null,
    columns: t.columns.map((c) => ({
      id: c.id,
      name: c.name,
      dataType: c.dataType,
      nullable: c.nullable,
      primaryKey: c.primaryKey,
      unique: c.unique,
      defaultValue: c.defaultValue || null,
    })),
  }));

  const relationships = workspace.relationships.map((r) => ({
    id: r.id,
    sourceTableId: r.sourceTableId,
    sourceTableName: r.sourceTable?.name || '',
    sourceColumnId: r.sourceColumnId,
    sourceColumnName: r.sourceColumn?.name || '',
    targetTableId: r.targetTableId,
    targetTableName: r.targetTable?.name || '',
    targetColumnId: r.targetColumnId,
    targetColumnName: r.targetColumn?.name || '',
    relationshipType: r.relationshipType,
  }));

  return {
    workspaceName: workspace.name,
    databaseType: workspace.databaseType,
    tables,
    relationships,
  };
}
