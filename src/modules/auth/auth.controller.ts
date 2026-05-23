import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { registerUser, loginUser } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // validation ----------------
    if (!name || !email || !password) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Name, email, and password are required.');
      return;
    }

    const user = await registerUser({ name, email, password, role });
    sendSuccess(res, StatusCodes.CREATED, 'User registered successfully', user);
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode) {
      sendError(res, error.statusCode, error.message ?? 'Registration failed');
    } else {
      next(err);
    }
  }
};



/// login---------------------------
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Email and password are required.');
      return;
    }

    const data = await loginUser({ email, password });
    sendSuccess(res, StatusCodes.OK, 'Login successful', data);
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode) {
      sendError(res, error.statusCode, error.message ?? 'Login failed');
    } else {
      next(err);
    }
  }
};
