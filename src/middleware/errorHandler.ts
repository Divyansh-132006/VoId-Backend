import { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../utils/errors';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found.' }
  });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' }
    });
    return;
  }

  const appError = error instanceof AppError
    ? error
    : new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
  response.status(appError.statusCode).json({
    error: { code: appError.code, message: appError.message }
  });
};