import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response';

export interface JwtPayload {
  id: number;
  name: string;
  role: 'contributor' | 'maintainer';
};

// Request --- include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['authorization'];

  if (!token) {
    sendError(res, StatusCodes.UNAUTHORIZED, 'Access denied. No token provided.');
    return;
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid or expired token.');
  }
};


//-------

export const authorizeMaintainer = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'maintainer') {
    sendError(res, StatusCodes.FORBIDDEN, 'Access denied. Maintainer role required.');
    return;
  }
  next();
};
