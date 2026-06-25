import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/db.js';

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
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. No authorization token was provided.',
    });
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
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 3. Attach user context to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Your token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid access token.',
    });
  }
};
