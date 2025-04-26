import React from 'react';
import { OrderType } from './OrderTypeSelector';
import { PaperType } from './PaperTypeSelector';
import { ShippingInfo } from './ShippingForm';

interface OrderSummaryProps {
  orderType: OrderType;
  paperType?: PaperType;
  shippingInfo?: ShippingInfo;
  imagesCount: number;
  onCheckout: () => void;
  isProcessing?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  orderType,
  paperType,
  shippingInfo,
  imagesCount,
  onCheckout,
  isProcessing = false,
}) => {
  // Calculate prices
  const basePrice = orderType === 'digital' ? 9.99 : 19.99;
  const shippingPrice = orderType === 'physical' ? 4.99 : 0;
  const total = basePrice + shippingPrice;

  // Format price for display
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Check if we can proceed to checkout
  const canCheckout = () => {
    if (orderType === 'digital') {
      return imagesCount >= 8;
    } else {
      return (
        imagesCount >= 8 &&
        paperType &&
        shippingInfo?.name &&
        shippingInfo?.address1 &&
        shippingInfo?.city &&
        shippingInfo?.state &&
        shippingInfo?.zipCode &&
        shippingInfo?.country
      );
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">Order Summary</h2>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Order Type:</span>
          <span className="font-medium">
            {orderType === 'digital' ? 'Digital Download' : 'Physical Copy'}
          </span>
        </div>

        {orderType === 'physical' && paperType && (
          <div className="flex justify-between">
            <span>Paper Type:</span>
            <span className="font-medium">
              {paperType === 'thin_matte' ? 'Thinner Matte Paper' : 'Thicker Paper with Sheen'}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Number of Photos:</span>
          <span className="font-medium">{imagesCount}</span>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between">
            <span>Base Price:</span>
            <span className="font-medium">{formatPrice(basePrice)}</span>
          </div>

          {orderType === 'physical' && (
            <div className="flex justify-between mt-1">
              <span>Shipping & Handling:</span>
              <span className="font-medium">{formatPrice(shippingPrice)}</span>
            </div>
          )}

          <div className="flex justify-between mt-2 text-lg font-bold">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {orderType === 'physical' && shippingInfo && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="font-medium mb-2">Shipping Address:</h3>
            <address className="not-italic">
              {shippingInfo.name}
              <br />
              {shippingInfo.address1}
              {shippingInfo.address2 && (
                <>
                  <br />
                  {shippingInfo.address2}
                </>
              )}
              <br />
              {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
              <br />
              {getCountryName(shippingInfo.country)}
              <br />
              {shippingInfo.phone}
            </address>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={onCheckout}
            disabled={!canCheckout() || isProcessing}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              canCheckout() && !isProcessing
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Proceed to Checkout'
            )}
          </button>

          {!canCheckout() && orderType === 'physical' && !shippingInfo && (
            <p className="text-sm text-center mt-2 text-red-500">
              Please complete the shipping information before proceeding to checkout.
            </p>
          )}

          {!canCheckout() && imagesCount < 8 && (
            <p className="text-sm text-center mt-2 text-red-500">
              Please upload at least 8 photos before proceeding to checkout.
            </p>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center pt-2">
          By proceeding to checkout, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

// Helper function to get country name from code
const getCountryName = (code: string) => {
  const countries: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    MX: 'Mexico',
    UK: 'United Kingdom',
    // Add more countries as needed
  };

  return countries[code] || code;
};

export default OrderSummary;
