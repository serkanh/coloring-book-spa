import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { OrderType } from '../components/OrderTypeSelector';

interface OrderConfirmationState {
  orderType: OrderType;
  imagesCount: number;
  paperType?: string;
  hasShippingInfo?: boolean;
}

const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as OrderConfirmationState | null;

  // If no state is passed (direct navigation to this page), redirect to home
  if (!state) {
    return <Navigate to="/" replace />;
  }

  const { orderType, imagesCount, paperType, hasShippingInfo } = state;

  // Generate a mock order number
  const orderNumber = `CB-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`;

  // Set expected delivery time based on order type
  const getDeliveryInfo = () => {
    if (orderType === 'digital') {
      return {
        timeframe: 'within 2 hours',
        method: 'emailed to you',
      };
    } else {
      return {
        timeframe: 'in 5-7 business days',
        method: 'shipped to your address',
      };
    }
  };

  const deliveryInfo = getDeliveryInfo();

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-green-500 p-8 text-center text-white">
          <svg
            className="h-16 w-16 mx-auto text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-3xl font-bold mt-4">Thank You For Your Order!</h1>
          <p className="text-lg mt-2">Your coloring book is being processed.</p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Order Details</h2>
            <div className="border-t border-b border-gray-200 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Order Number:</p>
                  <p className="font-medium">{orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Order Date:</p>
                  <p className="font-medium">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 py-4">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Type:</p>
                  <p>{orderType === 'digital' ? 'Digital Download' : 'Physical Copy'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Number of Pages:</p>
                  <p>{imagesCount}</p>
                </div>
                {orderType === 'physical' && paperType && (
                  <div>
                    <p className="text-gray-600">Paper Type:</p>
                    <p>{paperType === 'thin_matte' ? 'Thinner Matte Paper' : 'Thicker Paper with Sheen'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="py-4">
              <h3 className="font-semibold mb-2">Delivery Information</h3>
              <p>Your coloring book will be {deliveryInfo.method} {deliveryInfo.timeframe}.</p>

              {orderType === 'digital' && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-2">
                  <p className="text-sm">
                    <span className="font-medium">Note:</span> Once your coloring book is ready, you will receive
                    an email with a download link. Please check your spam folder if you don't see it in your inbox.
                  </p>
                </div>
              )}

              {orderType === 'physical' && hasShippingInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-2">
                  <p className="text-sm">
                    <span className="font-medium">Note:</span> You will receive a shipping confirmation
                    email with tracking information once your order ships.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-8">
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-md mb-4 sm:mb-0 hover:bg-blue-700 transition w-full sm:w-auto text-center"
            >
              Go to My Dashboard
            </Link>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 px-6 py-3 transition w-full sm:w-auto text-center"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>

      {/* What's Next Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">What's Next?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Processing</h3>
            <p className="text-gray-600">
              We're converting your photos to beautiful coloring pages. This typically takes 1-2 hours.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Notification</h3>
            <p className="text-gray-600">
              {orderType === 'digital'
                ? "You'll receive an email with your download link when ready."
                : "You'll get an email confirmation when your order ships."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Enjoy!</h3>
            <p className="text-gray-600">
              Start coloring your memories and share your creations with friends and family.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
