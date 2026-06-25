import { ROLES } from '../utils/roles.js';

/**
 * Middleware to restrict access based on user roles.
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication context is missing. Ensure protect middleware is executed first.',
      });
    }

    const userRole = req.user.role;

    // Admin has full access by default. Otherwise, check if user's role is in allowed list.
    if (userRole !== ROLES.ADMIN && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. You do not have permission to perform this action.',
      });
    }

    next();
  };
};
