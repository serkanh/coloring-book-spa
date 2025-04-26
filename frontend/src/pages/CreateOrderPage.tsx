import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader';
import OrderTypeSelector, { OrderType } from '../components/OrderTypeSelector';
import PaperTypeSelector, { PaperType } from '../components/PaperTypeSelector';
import ShippingForm, { ShippingInfo } from '../components/ShippingForm';
import OrderSummary from '../components/OrderSummary';

const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();

  // State for the order creation process
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('digital');
  const [paperType, setPaperType] = useState<PaperType>('thin_matte');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | undefined>();
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Handle file upload completion
  const handleUploadComplete = (files: File[]) => {
    setIsUploading(true);

    // Simulate upload to server
    setTimeout(() => {
      setUploadedFiles(files);
      setUploadComplete(true);
      setIsUploading(false);
    }, 2000);
  };

  // Handle order type selection
  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
  };

  // Handle paper type selection
  const handlePaperTypeChange = (type: PaperType) => {
    setPaperType(type);
  };

  // Handle shipping info submission
  const handleShippingInfoSubmit = (data: ShippingInfo) => {
    setShippingInfo(data);
  };

  // Handle checkout
  const handleCheckout = () => {
    setIsProcessingOrder(true);

    // Simulate order processing
    setTimeout(() => {
      // In a real app, we would make API calls to create the order
      // and process payment

      // Navigate to confirmation page
      navigate('/confirmation', {
        state: {
          orderType,
          imagesCount: uploadedFiles.length,
          paperType: orderType === 'physical' ? paperType : undefined,
          // Don't pass the full shipping info for security reasons in a real app
          hasShippingInfo: !!shippingInfo
        }
      });
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create Your Coloring Book</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Image Upload Section */}
          <section className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Upload Your Photos</h2>
            {!uploadComplete ? (
              <ImageUploader
                maxFiles={24}
                minFiles={8}
                onUploadComplete={handleUploadComplete}
                isDisabled={isUploading}
              />
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium text-green-700">
                    {uploadedFiles.length} photos uploaded successfully!
                  </span>
                </div>
                <button
                  onClick={() => setUploadComplete(false)}
                  className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                >
                  Upload different photos
                </button>
              </div>
            )}
          </section>

          {/* Only show these sections if upload is complete */}
          {uploadComplete && (
            <>
              {/* Order Type Section */}
              <section className="bg-white shadow-md rounded-lg p-6">
                <OrderTypeSelector
                  selectedOrderType={orderType}
                  onOrderTypeChange={handleOrderTypeChange}
                />
              </section>

              {/* Paper Type Section (only for physical orders) */}
              <section className="bg-white shadow-md rounded-lg p-6">
                <PaperTypeSelector
                  selectedPaperType={paperType}
                  onPaperTypeChange={handlePaperTypeChange}
                  disabled={orderType !== 'physical'}
                />
              </section>

              {/* Shipping Information (only for physical orders) */}
              <section className="bg-white shadow-md rounded-lg p-6">
                <ShippingForm
                  onShippingInfoSubmit={handleShippingInfoSubmit}
                  disabled={orderType !== 'physical'}
                  initialData={shippingInfo}
                />
              </section>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <OrderSummary
              orderType={orderType}
              paperType={orderType === 'physical' ? paperType : undefined}
              shippingInfo={orderType === 'physical' ? shippingInfo : undefined}
              imagesCount={uploadedFiles.length}
              onCheckout={handleCheckout}
              isProcessing={isProcessingOrder}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderPage;
