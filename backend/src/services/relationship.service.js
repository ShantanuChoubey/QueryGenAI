import prisma from '../config/db.js';
import { getWorkspace } from './workspace.service.js';

/**
 * Create a new relationship.
 * Verifies that referenced tables and columns exist, belong to the same workspace, and are owned by the user.
 */
export async function createRelationship(userId, { sourceTableId, sourceColumnId, targetTableId, targetColumnId, relationshipType }) {
  // 1. Fetch tables and verify they exist and belong to the same workspace
  const [sourceTable, targetTable] = await Promise.all([
    prisma.table.findUnique({ where: { id: sourceTableId }, include: { columns: true } }),
    prisma.table.findUnique({ where: { id: targetTableId }, include: { columns: true } }),
  ]);

  if (!sourceTable || !targetTable) {
    const error = new Error('Source or target table not found');
    error.status = 404;
    throw error;
  }

  if (sourceTable.workspaceId !== targetTable.workspaceId) {
    const error = new Error('Referenced tables must belong to the same workspace');
    error.status = 400;
    throw error;
  }

  const workspaceId = sourceTable.workspaceId;

  // 2. Verify workspace ownership
  await getWorkspace(workspaceId, userId);

  // 3. Verify columns exist on respective tables
  const sourceColumnExists = sourceTable.columns.some((c) => c.id === sourceColumnId);
  const targetColumnExists = targetTable.columns.some((c) => c.id === targetColumnId);

  if (!sourceColumnExists || !targetColumnExists) {
    const error = new Error('Source or target column not found on the specified table');
    error.status = 404;
    throw error;
  }

  // 4. Create the relationship
  const relationship = await prisma.relationship.create({
    data: {
      workspaceId,
      sourceTableId,
      sourceColumnId,
      targetTableId,
      targetColumnId,
      relationshipType,
    },
  });

  return relationship;
}

/**
 * List all relationships in a workspace.
 * Verifies workspace ownership.
 */
export async function listWorkspaceRelationships(workspaceId, userId) {
  await getWorkspace(workspaceId, userId);

  const relationships = await prisma.relationship.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return relationships;
}

/**
 * Get a single relationship by ID.
 * Verifies that the relationship exists and belongs to a workspace owned by the user.
 */
export async function getRelationship(relationshipId, userId) {
  const relationship = await prisma.relationship.findUnique({
    where: { id: relationshipId },
    include: {
      workspace: true,
    },
  });

  if (!relationship) {
    const error = new Error('Relationship not found');
    error.status = 404;
    throw error;
  }

  if (relationship.workspace.userId !== userId) {
    const error = new Error('Access denied. You do not own this workspace.');
    error.status = 403;
    throw error;
  }

  const { workspace, ...relationshipData } = relationship;
  return relationshipData;
}

/**
 * Update an existing relationship by ID.
 * Verifies ownership and referenced entities if changed.
 */
export async function updateRelationship(relationshipId, userId, { sourceTableId, sourceColumnId, targetTableId, targetColumnId, relationshipType }) {
  const existingRel = await getRelationship(relationshipId, userId);

  const newSourceTableId = sourceTableId || existingRel.sourceTableId;
  const newSourceColumnId = sourceColumnId || existingRel.sourceColumnId;
  const newTargetTableId = targetTableId || existingRel.targetTableId;
  const newTargetColumnId = targetColumnId || existingRel.targetColumnId;

  // If any source/target table or column IDs are updated, perform verification
  if (sourceTableId || sourceColumnId || targetTableId || targetColumnId) {
    const [sourceTable, targetTable] = await Promise.all([
      prisma.table.findUnique({ where: { id: newSourceTableId }, include: { columns: true } }),
      prisma.table.findUnique({ where: { id: newTargetTableId }, include: { columns: true } }),
    ]);

    if (!sourceTable || !targetTable) {
      const error = new Error('Source or target table not found');
      error.status = 404;
      throw error;
    }

    if (sourceTable.workspaceId !== targetTable.workspaceId) {
      const error = new Error('Referenced tables must belong to the same workspace');
      error.status = 400;
      throw error;
    }

    if (sourceTable.workspaceId !== existingRel.workspaceId) {
      const error = new Error('Cannot move relationship to a different workspace');
      error.status = 400;
      throw error;
    }

    const sourceColumnExists = sourceTable.columns.some((c) => c.id === newSourceColumnId);
    const targetColumnExists = targetTable.columns.some((c) => c.id === newTargetColumnId);

    if (!sourceColumnExists || !targetColumnExists) {
      const error = new Error('Source or target column not found on the specified table');
      error.status = 404;
      throw error;
    }
  }

  const updatedRelationship = await prisma.relationship.update({
    where: { id: relationshipId },
    data: {
      sourceTableId: newSourceTableId,
      sourceColumnId: newSourceColumnId,
      targetTableId: newTargetTableId,
      targetColumnId: newTargetColumnId,
      relationshipType: relationshipType || existingRel.relationshipType,
    },
  });

  return updatedRelationship;
}

/**
 * Delete a relationship by ID.
 * Verifies ownership.
 */
export async function deleteRelationship(relationshipId, userId) {
  await getRelationship(relationshipId, userId);

  await prisma.relationship.delete({
    where: { id: relationshipId },
  });

  return { id: relationshipId };
}
