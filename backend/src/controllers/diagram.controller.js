import { getWorkspaceDiagram } from '../services/diagram.service.js';

/**
 * GET /api/v1/workspaces/:workspaceId/diagram
 * Returns structured ER diagram data (tables, columns, relationships) for
 * the authenticated owner of the workspace. Read-only — no mutation allowed.
 */
export async function getDiagram(req, res, next) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const diagram = await getWorkspaceDiagram(workspaceId, userId);

    return res.status(200).json({
      status: 'success',
      data: diagram,
    });
  } catch (err) {
    next(err);
  }
}

