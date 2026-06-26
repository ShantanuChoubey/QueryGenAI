import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/db.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Protect middleware enforcing JWT authentication.
 */
export const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 401, 'Access denied. No authorization token was provided.', 'Unauthorized');
  }

  try {
    // 1. Verify token
    const decoded = verifyToken(token);

    // 2. Fetch user from database using decoded payload id
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 401, 'The user belonging to this token no longer exists.', 'Unauthorized');
    }

    // 3. Attach user context to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);

    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Your token has expired. Please log in again.', 'Unauthorized');
    }

    return errorResponse(res, 401, 'Invalid access token.', 'Unauthorized');
  }
};

