import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error,
  // req: Request,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);
  sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong', err.message);
};
