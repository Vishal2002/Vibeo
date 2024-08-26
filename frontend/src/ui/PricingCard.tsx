import React from 'react';

interface PricingCardProps {
  title: string;
  price: number;
  features: string[];
  pricingType: 'monthly' | 'yearly';
  isPopular?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, price, features, pricingType, isPopular = false }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 flex flex-col ${isPopular ? 'border-2 border-blue-500' : ''}`}>
      {isPopular && (
        <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full self-start mb-4">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="mb-6">
        <span className="text-3xl font-bold">${price}</span>
        <span className="text-gray-500">/{pricingType}</span>
      </div>
      <ul className="mb-6 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center mb-2">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <button className={`w-full py-2 px-4 rounded-md font-semibold  bg-blue-500 text-white }`}>
        Subscribe
      </button>
    </div>
  );
};

export default PricingCard;