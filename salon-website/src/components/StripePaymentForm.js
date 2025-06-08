import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function StripePaymentForm({ amount, appointmentId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, appointmentId })
      });

      if (!res.ok) throw new Error('Failed to create payment intent');

      const { clientSecret } = await res.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      });

      if (result.error) {
        toast.error(`❌ Payment error: ${result.error.message}`);
      } else if (result.paymentIntent?.status === 'succeeded') {
        toast.success('✅ Payment successful! Your appointment is confirmed.');
        await fetch(`/api/appointments/${appointmentId}/confirm`, { method: 'POST' });
        onSuccess();
      } else {
        toast.error('❌ Payment failed. Please try again.');
      }
    } catch (err) {
      toast.error(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment}>
      <h3>Pay ₱{amount} downpayment</h3>
      <CardElement />
      <button disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
