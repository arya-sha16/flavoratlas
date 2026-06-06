export const errorHandler = (err, req, res, next) => {
  console.error('💥 Unhandled Exception:', err.stack || err.message);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(400).json({
      error: `A record with this ${field} already exists.`
    });
  }

  // Multer file upload limit / format errors
  if (err instanceof Error && err.message.includes('Only image files are allowed')) {
    return res.status(400).json({ error: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An internal server error occurred.';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
