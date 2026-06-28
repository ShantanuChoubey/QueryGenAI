import prisma from '../config/db.js';

/**
 * Generate a structured schema context object from Prisma tables, columns, and relationships
 * to be injected into the AI generation prompt.
 *
 * @param {string} workspaceId - The UUID of the workspace
 * @returns {Promise<Object|null>} Structured schema context or null if workspace doesn't exist
 */
export async function generateSchemaContext(workspaceId) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      tables: {
        include: {
          columns: true,
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
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  const tables = workspace.tables.map((table) => {
    return {
      name: table.name,
      description: table.description || undefined,
      columns: table.columns.map((col) => ({
        name: col.name,
        dataType: col.dataType,
        nullable: col.nullable,
        primaryKey: col.primaryKey,
        unique: col.unique,
        defaultValue: col.defaultValue || undefined,
      })),
    };
  });

  const relationships = workspace.relationships.map((rel) => ({
    sourceTable: rel.sourceTable?.name || rel.sourceTableId,
    sourceColumn: rel.sourceColumn?.name || rel.sourceColumnId,
    targetTable: rel.targetTable?.name || rel.targetTableId,
    targetColumn: rel.targetColumn?.name || rel.targetColumnId,
    relationshipType: rel.relationshipType,
  }));

  return {
    workspaceName: workspace.name,
    databaseType: workspace.databaseType,
    tables,
    relationships,
  };
}
