import React from 'react';

export type OrderType = 'digital' | 'physical';

interface OrderTypeSelectorProps {
  selectedOrderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
}

const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  selectedOrderType,
  onOrderTypeChange,
}) => {
  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">Choose Your Order Type</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Digital Download Option */}
        <div
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all transform hover:shadow-lg
            ${selectedOrderType === 'digital'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
            }`}
          onClick={() => onOrderTypeChange('digital')}
        >
          <div className="flex items-center mb-3">
            <input
              type="radio"
              checked={selectedOrderType === 'digital'}
              onChange={() => onOrderTypeChange('digital')}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-xl font-medium">Digital PDF Download</span>
          </div>

          <div className="ml-7">
            <p className="text-gray-600 mb-3">
              Receive your coloring book as a digital PDF file that you can print
              at home or at a local print shop.
            </p>

            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant delivery via email</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Print as many copies as you want</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Choose your own paper type</span>
              </li>
            </ul>

            <p className="mt-4 font-semibold">Price: $9.99</p>
          </div>
        </div>

        {/* Physical Copy Option */}
        <div
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all transform hover:shadow-lg
            ${selectedOrderType === 'physical'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
            }`}
          onClick={() => onOrderTypeChange('physical')}
        >
          <div className="flex items-center mb-3">
            <input
              type="radio"
              checked={selectedOrderType === 'physical'}
              onChange={() => onOrderTypeChange('physical')}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-xl font-medium">Physical Coloring Book</span>
          </div>

          <div className="ml-7">
            <p className="text-gray-600 mb-3">
              Receive a professionally printed and bound coloring book delivered
              to your door.
            </p>

            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Professional printing quality</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Sturdy binding that lays flat</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Ships within 3-5 business days</span>
              </li>
            </ul>

            <p className="mt-4 font-semibold">Price: $19.99 + shipping</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTypeSelector;
