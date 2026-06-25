import { registerUser, loginUser } from '../services/auth.js';

/**
 * Handle user registration requests.
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const user = await registerUser({ email, password, fullName });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
    });
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

    return res.status(200).json({
      success: true,
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
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
