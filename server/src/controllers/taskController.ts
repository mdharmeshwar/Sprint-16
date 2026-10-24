import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import Task from '../models/Task.js';
import { getMemoryTaskById, getMemoryTasksByAuthor, makeId, memoryTasks, useMemoryStore } from '../utils/memoryStore.js';
import { isValidObjectId } from '../utils/validation.js';
import { buildErrorResponse } from '../utils/response.js';

// The fallback in-memory store uses generated URL-safe IDs; Mongo-backed
// records continue to require a valid ObjectId.
const isValidTaskId = (id: string) => useMemoryStore()
  ? /^[a-z0-9]{12,24}$/i.test(id)
  : isValidObjectId(id);

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, priority, status, dueDate } = req.body || {};

  if (!title || !description || !priority || !status) {
    return res.status(400).json(buildErrorResponse('Title, description, priority, and status are required.', 'VALIDATION_ERROR'));
  }

  if (useMemoryStore()) {
    const task: any = {
      _id: makeId(),
      title: String(title),
      description: String(description),
      priority: String(priority),
      status: String(status),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      authorId: req.user?._id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryTasks.push(task);
    return res.status(201).json({ success: true, message: 'Task created.', data: task });
  }

  const task = await Task.create({
    title,
    description,
    priority,
    status,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    authorId: req.user?._id,
  });

  return res.status(201).json({ success: true, message: 'Task created.', data: task });
};

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  if (useMemoryStore()) {
    const tasks = getMemoryTasksByAuthor(req.user?._id || '');
    return res.status(200).json({ success: true, data: tasks });
  }

  const tasks = await Task.find({ authorId: req.user?._id }).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: tasks });
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!isValidTaskId(id)) {
    return res.status(400).json(buildErrorResponse('Invalid task id.', 'INVALID_IDENTIFIER'));
  }

  if (useMemoryStore()) {
    const task = getMemoryTaskById(id);
    if (!task) {
      return res.status(404).json(buildErrorResponse('Task not found.', 'NOT_FOUND'));
    }

    if (task.authorId !== req.user?._id) {
      return res.status(403).json(buildErrorResponse('You are not authorized to view this task.', 'FORBIDDEN'));
    }

    return res.status(200).json({ success: true, data: task });
  }

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json(buildErrorResponse('Task not found.', 'NOT_FOUND'));
  }

  if (task.authorId.toString() !== req.user?._id) {
    return res.status(403).json(buildErrorResponse('You are not authorized to view this task.', 'FORBIDDEN'));
  }

  return res.status(200).json({ success: true, data: task });
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!isValidTaskId(id)) {
    return res.status(400).json(buildErrorResponse('Invalid task id.', 'INVALID_IDENTIFIER'));
  }

  if (useMemoryStore()) {
    const task = getMemoryTaskById(id);
    if (!task) {
      return res.status(404).json(buildErrorResponse('Task not found.', 'NOT_FOUND'));
    }

    if (task.authorId !== req.user?._id) {
      return res.status(403).json(buildErrorResponse('You are not authorized to update this task.', 'FORBIDDEN'));
    }

    const updatedTask = {
      ...task,
      ...req.body,
      authorId: req.user?._id || task.authorId,
      updatedAt: new Date(),
    };

    const index = memoryTasks.findIndex((entry) => entry._id === id);
    if (index >= 0) memoryTasks[index] = updatedTask;

    return res.status(200).json({ success: true, message: 'Task updated.', data: updatedTask });
  }

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json(buildErrorResponse('Task not found.', 'NOT_FOUND'));
  }

  if (task.authorId.toString() !== req.user?._id) {
    return res.status(403).json(buildErrorResponse('You are not authorized to update this task.', 'FORBIDDEN'));
  }

  const updatedTask = await Task.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  return res.status(200).json({ success: true, message: 'Task updated.', data: updatedTask });
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!isValidTaskId(id)) {
    return res.status(400).json(buildErrorResponse('Invalid task id.', 'INVALID_IDENTIFIER'));
  }

  if (useMemoryStore()) {
    const task = getMemoryTaskById(id);
    if (!task) {
      return res.status(404).json(buildErrorResponse('Task not found.', 'NOT_FOUND'));
    }

    if (task.authorId !== req.user?._id) {
      return res.status(403).json(buildErrorResponse('You are not authorized to delete this task.', 'FORBIDDEN'));
    }

    const index = memoryTasks.findIndex((entry) => entry._id === id);
    if (index >= 0) memoryTasks.splice(index, 1);

    return res.status(200).json({ success: true, message: 'Task deleted.' });
  }

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json(buildErrorResponse('Task not found.', 'NOT_FOUND'));
  }

  if (task.authorId.toString() !== req.user?._id) {
    return res.status(403).json(buildErrorResponse('You are not authorized to delete this task.', 'FORBIDDEN'));
  }

  await task.deleteOne();
  return res.status(200).json({ success: true, message: 'Task deleted.' });
};
