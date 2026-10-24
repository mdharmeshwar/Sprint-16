import { Router } from 'express';
import { createCheckoutSession } from '../controllers/stripeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/create-checkout-session', asyncHandler(protect), asyncHandler(createCheckoutSession));

export default router;
