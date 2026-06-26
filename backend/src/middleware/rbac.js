import { ROLES } from '../utils/roles.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Middleware to restrict access based on user roles.
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication context is missing. Ensure protect middleware is executed first.', 'Unauthorized');
    }

    const userRole = req.user.role;

    // Admin has full access by default. Otherwise, check if user's role is in allowed list.
    if (userRole !== ROLES.ADMIN && !allowedRoles.includes(userRole)) {
      return errorResponse(res, 403, 'Access denied. You do not have permission to perform this action.', 'Forbidden');
    }

    next();
  };
};

