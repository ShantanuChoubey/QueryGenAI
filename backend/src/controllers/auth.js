import { registerUser, loginUser } from '../services/auth.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Handle user registration requests.
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const user = await registerUser({ email, password, fullName });

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
