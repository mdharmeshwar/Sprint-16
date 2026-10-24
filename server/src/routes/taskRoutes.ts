import { Router } from 'express';
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.route('/').get(asyncHandler(protect), asyncHandler(getTasks)).post(asyncHandler(protect), validateRequest('task'), asyncHandler(createTask));
router.route('/:id').get(asyncHandler(protect), asyncHandler(getTaskById)).put(asyncHandler(protect), validateRequest('taskUpdate'), asyncHandler(updateTask)).delete(asyncHandler(protect), asyncHandler(deleteTask));

export default router;
