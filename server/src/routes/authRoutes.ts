import { Router } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { loginRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/register', validateRequest('register'), asyncHandler(registerUser));
router.post('/login', loginRateLimiter, validateRequest('login'), asyncHandler(loginUser));
router.get('/me', asyncHandler(protect), asyncHandler(getCurrentUser));

export default router;
