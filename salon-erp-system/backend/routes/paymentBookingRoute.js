const express = require('express');
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51RJZk7BUX1YRSZL7mTc6y8TDz1c4iiEzn1hsiCEBSpr8olaWxaldmxhyuIFaimYznYbdhuHy4jKm920LaP6dCx3y00tJ1W8Chi'); // your secret key
const router = express.Router();

router.post('/create-payment-intent', async (req, res) => {
  const { amount, appointmentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // in cents
      currency: 'php',
      metadata: { appointment_id: appointmentId }
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to create payment intent' });
  }
});

module.exports = router;
