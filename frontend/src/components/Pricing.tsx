import React, { useState } from 'react';
import PricingCard from '../ui/PricingCard';
import { loadStripe } from '@stripe/stripe-js';

import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('sdasdasdasdadasd');

const CheckoutForm = ({ planId, price }:{planId:string,price:number}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event:any) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      return;
    }

    // Create payment intent on the server
    const response = await fetch(`localhost:8080/api/v1/create-payment-intent/${planId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ price }),
    });

    const { clientSecret } = await response.json();

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.error) {
      setError(result.error?.message);
    } else {
      // The payment has been processed!
      if (result.paymentIntent.status === 'succeeded') {
        // Handle successful payment here
        console.log('Payment successful!');
      }
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Subscribe'}
      </button>
      {error && <div>{error}</div>}
    </form>
  );
};

const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  const pricingPlans = [
    {
      id:'1',
      title: 'Basic',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: ['1 User', '10GB Storage', 'Basic Support'],
      pricingType: 'monthly' as const,
    },
    {
      id:'2',
      title: 'Pro',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: ['5 Users', '50GB Storage', 'Priority Support', 'Advanced Features'],
      pricingType: 'monthly' as const,
      isPopular: true,
    },
    {
      id:'3',
      title: 'Enterprise',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      features: ['Unlimited Users', '500GB Storage', '24/7 Support', 'Custom Solutions'],
      pricingType: 'monthly' as const,
    },
  ];

  return (
    <Elements stripe={stripePromise}>
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
      
      <div className="flex justify-center items-center mb-8">
        <span className={`mr-3 ${!isYearly ? 'font-bold' : ''}`}>Monthly</span>
        <div 
          className="relative inline-block w-16 h-8 cursor-pointer"
          onClick={() => setIsYearly(!isYearly)}
        >
          <div className={`block w-full h-full rounded-full bg-gray-300 ${isYearly ? 'bg-blue-500' : ''} transition-colors duration-200`}></div>
          <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 transform ${isYearly ? 'translate-x-8' : ''}`}></div>
        </div>
        <span className={`ml-3 ${isYearly ? 'font-bold' : ''}`}>Yearly</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div key={index}>
              <PricingCard 
                {...plan} 
                price={isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                pricingType={isYearly ? 'yearly' : 'monthly'}
              />
              <CheckoutForm planId={plan.id} price={isYearly ? plan.yearlyPrice : plan.monthlyPrice} />
            </div>
          ))}
        </div>
    </div>
    </Elements>
  );
};

export default Pricing;