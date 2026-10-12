import type { Request, Response } from 'express';
import Stripe from 'stripe';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
  });
};

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response) => {
  const stripe = getStripeClient();

  if (!stripe) {
    return res.status(500).json({ success: false, message: 'Stripe is not configured.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Task Matrix Pro',
            },
            unit_amount: 3000,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout/cancel`,
      metadata: {
        userId: req.user?._id || 'anonymous',
      },
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create checkout session.' });
  }
};
