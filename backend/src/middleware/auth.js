// Placeholder authorization middleware checking JWT headers
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization token was provided',
    });
  }

  // Future verification logic
  next();
};
