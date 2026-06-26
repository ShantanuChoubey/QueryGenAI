import { registerUser, loginUser } from '../services/auth.js';
import { successResponse } from '../utils/apiResponse.js';
import prisma from '../config/db.js';

/**
 * Handle user registration requests.
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const user = await registerUser({ email, password, fullName });

    // Record AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'USER_REGISTER',
        userId: user.id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
      },
    }).catch((err) => console.error('Failed to save AuditLog:', err));

    return successResponse(res, 201, 'User registered successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user authentication and token issuance.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await loginUser({ email, password });

    // Record AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'USER_LOGIN',
        userId: data.user.id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
      },
    }).catch((err) => console.error('Failed to save AuditLog:', err));

    return successResponse(res, 200, 'Authentication successful', {
      token: data.token,
      user: data.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle requesting active authentication profile context.
 */
export const me = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'Profile retrieved successfully', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
