import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { signToken } from '../utils/jwt.js';

/**
 * Register a new user in the database.
 */
export async function registerUser({ email, password, fullName }) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error('Email is already registered');
    error.status = 409;
    throw error;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: 'VIEWER', // default role
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return newUser;
}

/**
 * Authenticate user credentials and return signed access token.
 */
export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}
