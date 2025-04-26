import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ImageProcessing from './ImageProcessing';

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
  minFiles = 8,
  isDisabled = false,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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

  // Upload processed images to the server
  const handleUpload = async () => {
    if (processedImages.length < minFiles) {
      setError(`Please process at least ${minFiles} images.`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // We would upload the processed images here
      // For now, just simulate completion
      const allProcessedUrls = processedImages.map((img) => img.processedUrl);

      console.log('Processed images ready to upload:', allProcessedUrls);

      // In a real implementation, you would upload these URLs to your backend
      // For demo purposes we'll just show them as completed
      if (onUploadComplete) {
        // Pass the original files for backward compatibility
        onUploadComplete(processedImages.map((img) => img.originalFile));
      }
    } catch (err) {
      console.error('Error uploading processed images:', err);
      setError('Failed to upload processed images. Please try again.');
    } finally {
      setIsUploading(false);
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
              <div key={index} className="relative">
                <img
                  src={processedImg.processedUrl}
                  alt={`Processed ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-lg"
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={handleUpload}
              className={`px-4 py-2 rounded-md transition ${
                canUpload
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canUpload || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Create Coloring Book'}
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
