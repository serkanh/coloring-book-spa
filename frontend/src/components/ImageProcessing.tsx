import React, { useState, useEffect, useCallback } from 'react';
import {
  processImage,
  getProcessingStatus,
  getProcessedImageUrl,
  confirmProcessedImage,
  cancelProcessing
} from '../services/imageProcessingService';

interface ImageProcessingProps {
  originalImage: File;
  onComplete?: (processedImageUrl: string) => void;
  onCancel?: () => void;
  customPrompt?: string;
}

const ImageProcessing: React.FC<ImageProcessingProps> = ({
  originalImage,
  onComplete,
  onCancel,
  customPrompt
}) => {
  // State for tracking the processing
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Create preview URL for original image
  useEffect(() => {
    if (originalImage) {
      const objectUrl = URL.createObjectURL(originalImage);
      setOriginalPreview(objectUrl);

      // Clean up the URL on unmount
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [originalImage]);

  // Start processing the image
  useEffect(() => {
    const startProcessing = async () => {
      try {
        const prompt = customPrompt || 'Convert this image to a black and white sketch suitable for a coloring book';
        const id = await processImage(originalImage, prompt);
        setJobId(id);

        // Poll for status
        pollStatus(id);
      } catch (err) {
        console.error('Error starting image processing:', err);
        setError('Failed to start image processing. Please try again.');
        setStatus('failed');
      }
    };

    startProcessing();
  }, [originalImage, customPrompt]);

  // Poll for job status
  const pollStatus = useCallback(async (id: string) => {
    try {
      // Poll every 3 seconds until completed or failed
      const intervalId = setInterval(async () => {
        try {
          const response = await getProcessingStatus(id);
          setStatus(response.status);

          if (response.status === 'completed') {
            setProcessedPreview(getProcessedImageUrl(id));
            clearInterval(intervalId);
          } else if (response.status === 'failed') {
            setError(response.message || 'Image processing failed. Please try again.');
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error('Error polling status:', err);
          setError('Failed to get processing status. Please try again.');
          setStatus('failed');
          clearInterval(intervalId);
        }
      }, 3000);

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    } catch (err) {
      console.error('Error setting up polling:', err);
      setError('An error occurred while monitoring the image processing.');
    }
  }, []);

  // Handle confirmation of processed image
  const handleConfirm = async () => {
    if (!jobId) return;

    try {
      setIsConfirming(true);
      const processedImageUrl = await confirmProcessedImage(jobId);

      // Call the onComplete callback with the S3 URL
      if (onComplete) {
        onComplete(processedImageUrl);
      }
    } catch (err) {
      console.error('Error confirming image:', err);
      setError('Failed to confirm the processed image. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle cancellation
  const handleCancel = async () => {
    if (jobId) {
      try {
        await cancelProcessing(jobId);
      } catch (err) {
        console.error('Error canceling processing:', err);
      }
    }

    // Call the onCancel callback
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-medium mb-4">Image Processing</h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          <p>{error}</p>
          <button
            onClick={handleCancel}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        <div>
          <h3 className="text-lg font-medium mb-2">Original Photo</h3>
          {originalPreview && (
            <div className="border rounded-md overflow-hidden relative">
              <img
                src={originalPreview}
                alt="Original"
                className="w-full h-64 object-contain"
              />
            </div>
          )}
        </div>

        {/* Processed Image */}
        <div>
          <h3 className="text-lg font-medium mb-2">Coloring Book Page</h3>
          <div className="border rounded-md overflow-hidden relative h-64">
            {status === 'pending' || status === 'processing' ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    {status === 'pending' ? 'Starting...' : 'Processing...'}
                  </p>
                </div>
              </div>
            ) : processedPreview ? (
              <img
                src={processedPreview}
                alt="Processed"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <p className="text-gray-500">No preview available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={isConfirming}
        >
          Cancel
        </button>

        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          disabled={status !== 'completed' || isConfirming}
        >
          {isConfirming ? 'Confirming...' : 'Use This Image'}
        </button>
      </div>
    </div>
  );
};

export default ImageProcessing;
