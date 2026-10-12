import { Router } from 'express';
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateTaskPayload } from '../middleware/validateMiddleware.js';

const router = Router();

router.route('/').get(protect, getTasks).post(protect, validateTaskPayload, createTask);
router.route('/:id').get(protect, getTaskById).put(protect, validateTaskPayload, updateTask).delete(protect, deleteTask);

export default router;
