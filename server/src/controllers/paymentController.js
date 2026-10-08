import Stripe from 'stripe';
import { Board } from '../models/Board.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @route POST /api/payment/create-checkout-session
export const createCheckoutSession = async (req, res) => {
  try {
    const { boardId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Workspace Plan',
              description: 'Unlimited team members, S3 high storage & audit log access',
            },
            unit_amount: 1500, // $15.00/month
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/board/${boardId}?upgrade=success`,
      cancel_url: `${process.env.CLIENT_URL}/board/${boardId}?upgrade=cancelled`,
      metadata: {
        boardId,
        userId: req.user._id.toString(),
      },
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};