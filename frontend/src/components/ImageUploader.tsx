import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import ImageProcessing from './ImageProcessing';
import { deleteProcessedImage } from '../services/imageProcessingService';
import { generatePdf, getPdfStatus } from '../services/pdfService';

interface ImageUploaderProps {
  maxFiles: number;
  minFiles: number;
  isDisabled?: boolean;
  onUploadComplete?: (files: File[]) => void;
}

interface ProcessedImage {
  originalFile: File;
  processedUrl: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  maxFiles = 24,
  minFiles = parseInt(import.meta.env.VITE_MIN_IMAGES_REQUIRED || '8', 10),
  isDisabled = false,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeletingImage, setIsDeletingImage] = useState<number | null>(null);

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Check number of files
      if (acceptedFiles.length + files.length > maxFiles) {
        setError(`You can only upload a maximum of ${maxFiles} files.`);
        return;
      }

      // Preview the files
      const newFiles = acceptedFiles.map((file) => {
        // Create an object URL for preview
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        });
        return file;
      });

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      setError(null);
    },
    [files.length, maxFiles]
  );

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];

      // Release the preview URL object to free up memory
      URL.revokeObjectURL((newFiles[index] as File & { preview: string }).preview);

      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Handle initiating processing for a file
  const handleProcessFile = (file: File) => {
    setProcessingFile(file);
  };

  // Handle completion of image processing
  const handleProcessingComplete = (processedImageUrl: string) => {
    if (!processingFile) return;

    // Add to processed images
    setProcessedImages((prev) => [
      ...prev,
      {
        originalFile: processingFile,
        processedUrl: processedImageUrl,
      },
    ]);

    // Remove the file from the original list
    const fileIndex = files.findIndex((f) => f === processingFile);
    if (fileIndex !== -1) {
      removeFile(fileIndex);
    }

    // Clear the processing file
    setProcessingFile(null);
  };

  // Handle cancellation of image processing
  const handleProcessingCancel = () => {
    setProcessingFile(null);
  };

  // State for PDF generation
  const [pdfJobId, setPdfJobId] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Poll for PDF status when we have a jobId
  useEffect(() => {
    if (!pdfJobId) return;

    const checkStatus = async () => {
      try {
        const status = await getPdfStatus(pdfJobId);
        setPdfStatus(status.status);

        if (status.status === 'completed' && status.pdfUrl) {
          setPdfUrl(status.pdfUrl);
          setIsUploading(false);
        } else if (status.status === 'failed') {
          setError(`PDF generation failed: ${status.message || 'Unknown error'}`);
          setIsUploading(false);
        }
      } catch (err) {
        console.error('Error checking PDF status:', err);
      }
    };

    // Check immediately and then set up interval
    checkStatus();
    const intervalId = setInterval(checkStatus, 3000);

    // Clean up interval on unmount or when PDF is ready
    return () => clearInterval(intervalId);
  }, [pdfJobId]);

  // Generate PDF from processed images
  const handleUpload = async () => {
    if (processedImages.length < minFiles) {
      setError(`Please process at least ${minFiles} images.`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setPdfStatus('pending');
      setPdfUrl(null);

      // Get all processed image URLs
      const imageUrls = processedImages.map((img) => img.processedUrl);
      console.log('Starting PDF generation with', imageUrls.length, 'images');

      // Generate the PDF
      const jobId = await generatePdf(imageUrls, 'My Custom Coloring Book');
      setPdfJobId(jobId);

      console.log('PDF generation job started with ID:', jobId);

      // Status updates will be handled by the useEffect polling

      // Still call onUploadComplete for compatibility with old implementation
      if (onUploadComplete) {
        onUploadComplete(processedImages.map((img) => img.originalFile));
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate coloring book PDF. Please try again.');
      setIsUploading(false);
      setPdfStatus('failed');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isDisabled || !!processingFile,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
  });

  // Determine if we can proceed with upload
  const canUpload = processedImages.length >= minFiles;

  return (
    <div className="w-full">
      {/* Show processing UI if a file is being processed */}
      {processingFile ? (
        <div className="mb-6">
          <ImageProcessing
            originalImage={processingFile}
            onComplete={handleProcessingComplete}
            onCancel={handleProcessingCancel}
          />
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-50'}
          `}
        >
          <input {...getInputProps()} />
          {isDisabled ? (
            <div className="text-center">
              <p className="text-lg font-medium">Please sign in to upload photos</p>
              <p className="text-gray-500 mt-1">
                Create an account or log in to continue
              </p>
            </div>
          ) : isDragActive ? (
            <div className="text-center">
              <p className="text-lg font-medium">Drop your photos here...</p>
            </div>
          ) : (
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-medium mt-2">
                Drag and drop photos here, or click to browse
              </p>
              <p className="text-gray-500 mt-1">
                Upload {minFiles} to {maxFiles} photos (JPG or PNG only)
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* Unprocessed files */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-lg">Photos to Process ({files.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-3">
            {files.map((file, index) => {
              const fileWithPreview = file as File & { preview: string };
              return (
                <div key={index} className="relative">
                  <img
                    src={fileWithPreview.preview}
                    alt={file.name}
                    className="h-24 w-24 object-cover rounded-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 space-x-1">
                    <button
                      onClick={() => removeFile(index)}
                      className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600"
                      title="Remove"
                    >
                      &times;
                    </button>
                    <button
                      onClick={() => handleProcessFile(file)}
                      className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-blue-600"
                      title="Process"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Processed Images */}
      {processedImages.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-lg">Processed Images ({processedImages.length}/{minFiles} required)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-3">
            {processedImages.map((processedImg, index) => (
              <div key={index} className="relative group">
                <img
                  src={processedImg.processedUrl}
                  alt={`Processed ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-lg"
                />
                <button
                  onClick={async () => {
                    try {
                      setIsDeletingImage(index);
                      setError(null);

                      // Delete from S3
                      await deleteProcessedImage(processedImg.processedUrl);

                      // Remove from local state
                      setProcessedImages(prev => prev.filter((_, i) => i !== index));
                    } catch (err) {
                      console.error('Error deleting image:', err);
                      setError('Failed to delete image. Please try again.');
                    } finally {
                      setIsDeletingImage(null);
                    }
                  }}
                  disabled={isDeletingImage !== null}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  title="Delete processed image"
                >
                  {isDeletingImage === index ? (
                    <div className="animate-spin h-3 w-3 border-t-2 border-white rounded-full"></div>
                  ) : (
                    '×'
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            {/* PDF Generation Status */}
            {pdfUrl && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 font-medium">Your coloring book PDF is ready!</p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Download PDF
                </a>
              </div>
            )}

            {pdfStatus === 'processing' && !pdfUrl && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <p className="text-blue-700">Generating your coloring book PDF...</p>
                </div>
              </div>
            )}

            {pdfStatus === 'failed' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error || 'Failed to generate PDF. Please try again.'}</p>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleUpload}
              className={`px-4 py-2 rounded-md transition ${
                canUpload
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canUpload || isUploading}
            >
              {isUploading && !pdfUrl ? 'Creating PDF...' : 'Create Coloring Book'}
            </button>
            {!canUpload && (
              <p className="text-sm text-gray-500 mt-1">
                Please process at least {minFiles} images
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
