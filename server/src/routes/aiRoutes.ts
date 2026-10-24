import { Router } from 'express';
import { improveTaskDescription } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { aiRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';

const router = Router();

router.post('/suggest', asyncHandler(protect), aiRateLimiter, validateRequest('aiSuggestion'), asyncHandler(improveTaskDescription));

export default router;