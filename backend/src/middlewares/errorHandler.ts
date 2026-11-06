import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error caught in middleware:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor.'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
