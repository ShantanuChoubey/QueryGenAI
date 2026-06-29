import * as schemaImportService from '../services/schemaImport.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const previewSql = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const text = req.file.buffer.toString('utf-8');

    if (!text.trim()) {
      return errorResponse(res, 400, 'Uploaded file is empty.');
    }

    const parsed = schemaImportService.parseSqlDDL(text);
    const { errors, warnings } = schemaImportService.validateSchema(parsed);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Schema validation failed.',
        error: {
          error: 'ValidationError',
          details: errors,
          warnings
        }
      });
    }

    const preview = await schemaImportService.previewImport(workspaceId, userId, parsed);
    preview.warnings = [...new Set([...preview.warnings, ...warnings])];

    return successResponse(res, 200, 'SQL schema parsed successfully for preview.', preview);
  } catch (error) {
    next(error);
  }
};

export const previewJson = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const text = req.file.buffer.toString('utf-8');

    if (!text.trim()) {
      return errorResponse(res, 400, 'Uploaded file is empty.');
    }

    let parsed;
    try {
      parsed = schemaImportService.parseJson(text);
    } catch (parseError) {
      return errorResponse(res, parseError.status || 400, parseError.message);
    }

    const { errors, warnings } = schemaImportService.validateSchema(parsed);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Schema validation failed.',
        error: {
          error: 'ValidationError',
          details: errors,
          warnings
        }
      });
    }

    const preview = await schemaImportService.previewImport(workspaceId, userId, parsed);
    preview.warnings = [...new Set([...preview.warnings, ...warnings])];

    return successResponse(res, 200, 'JSON schema parsed successfully for preview.', preview);
  } catch (error) {
    next(error);
  }
};

export const previewCsv = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const text = req.file.buffer.toString('utf-8');

    if (!text.trim()) {
      return errorResponse(res, 400, 'Uploaded file is empty.');
    }

    let parsed;
    try {
      parsed = schemaImportService.parseCsv(text);
    } catch (parseError) {
      return errorResponse(res, parseError.status || 400, parseError.message);
    }

    const { errors, warnings } = schemaImportService.validateSchema(parsed);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Schema validation failed.',
        error: {
          error: 'ValidationError',
          details: errors,
          warnings
        }
      });
    }

    const preview = await schemaImportService.previewImport(workspaceId, userId, parsed);
    preview.warnings = [...new Set([...preview.warnings, ...warnings])];

    return successResponse(res, 200, 'CSV schema parsed successfully for preview.', preview);
  } catch (error) {
    next(error);
  }
};

export const confirmImport = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const { tables, relationships, conflictStrategy } = req.body;

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return errorResponse(res, 400, 'Invalid import payload: tables array is required and must not be empty.');
    }

    const result = await schemaImportService.commitImport(
      workspaceId,
      userId,
      { tables, relationships },
      conflictStrategy
    );

    return successResponse(res, 200, 'Schema imported successfully.', result);
  } catch (error) {
    next(error);
  }
};
