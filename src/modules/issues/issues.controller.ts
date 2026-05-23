import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from './issues.service';
import { sendSuccess, sendError } from '../../utils/response';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, type } = req.body;
    const reporter_id = req.user!.id;

    // Validation
    if (!title || !description || !type) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Title, description, and type are required.');
      return;
    }
    if (title.length > 150) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Title must be at most 150 characters.');
      return;
    }
    if (description.length < 20) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Description must be at least 20 characters.');
      return;
    }
    if (!['bug', 'feature_request'].includes(type)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Type must be bug or feature_request.');
      return;
    }

    const issue = await createIssue({ title, description, type, reporter_id });
    sendSuccess(res, StatusCodes.CREATED, 'Issue created successfully', issue);
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode) {
      sendError(res, error.statusCode, error.message ?? 'Failed to create issue');
    } else {
      next(err);
    }
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sort, type, status } = req.query as Record<string, string>;

    // Validate query params
    if (sort && !['newest', 'oldest'].includes(sort)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Sort must be newest or oldest.');
      return;
    }
    if (type && !['bug', 'feature_request'].includes(type)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Type must be bug or feature_request.');
      return;
    }
    if (status && !['open', 'in_progress', 'resolved'].includes(status)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Status must be open, in_progress, or resolved.');
      return;
    }

    const issues = await getAllIssues({ sort, type, status });
    // Assignment spec: GET all response has no "message" field
    res.status(StatusCodes.OK).json({ success: true, data: issues });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Invalid issue ID.');
      return;
    }

    const issue = await getIssueById(id);
    // Assignment spec: GET single response has no "message" field
    res.status(StatusCodes.OK).json({ success: true, data: issue });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode) {
      sendError(res, error.statusCode, error.message ?? 'Failed to fetch issue');
    } else {
      next(err);
    }
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Invalid issue ID.');
      return;
    }

    const { title, description, type, status } = req.body;
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;

    // Validate type if provided
    if (type && !['bug', 'feature_request'].includes(type)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Type must be bug or feature_request.');
      return;
    }
    // Validate status if provided
    if (status && !['open', 'in_progress', 'resolved'].includes(status)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Status must be open, in_progress, or resolved.');
      return;
    }

    const issue = await updateIssue(id, { title, description, type, status }, requesterId, requesterRole);
    sendSuccess(res, StatusCodes.OK, 'Issue updated successfully', issue);
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode) {
      sendError(res, error.statusCode, error.message ?? 'Failed to update issue');
    } else {
      next(err);
    }
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Invalid issue ID.');
      return;
    }

    await deleteIssue(id);
    sendSuccess(res, StatusCodes.OK, 'Issue deleted successfully');
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode) {
      sendError(res, error.statusCode, error.message ?? 'Failed to delete issue');
    } else {
      next(err);
    }
  }
};
