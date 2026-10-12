import { Router } from 'express';
import { createCheckoutSession } from '../controllers/stripeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/create-checkout-session', protect, createCheckoutSession);

export default router;
