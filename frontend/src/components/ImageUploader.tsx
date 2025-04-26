import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadImages } from '../services/uploadService';

interface ImageUploaderProps {
  maxFiles: number;
  minFiles: number;
  isDisabled?: boolean;
  onUploadComplete?: (files: File[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  maxFiles = 24,
  minFiles = 8,
  isDisabled = false,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

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

        // Initialize progress for this file
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: 0,
        }));

        return file;
      });

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      setError(null);
    },
    [files.length, maxFiles]
  );

  const removeFile = (index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];

      // Release the preview URL object to free up memory
      URL.revokeObjectURL((newFiles[index] as any).preview);

      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleUpload = async () => {
    if (files.length < minFiles) {
      setError(`Please upload at least ${minFiles} images.`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Reset progress for all files
      const initialProgress: Record<string, number> = {};
      files.forEach((file) => {
        initialProgress[file.name] = 0;
      });
      setUploadProgress(initialProgress);

      console.log('Uploading files to backend:', files);

      // Call the upload service
      const result = await uploadImages(files, (progress) => {
        // Update progress
        setUploadProgress(progress);
      });

      console.log('Upload completed successfully:', result);
      setUploadResult(result);

      // Call the onUploadComplete callback
      if (onUploadComplete) {
        onUploadComplete(files);
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isDisabled,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
  });

  return (
    <div className="w-full">
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

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium text-lg">Selected Photos ({files.length}/{maxFiles})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-3">
            {files.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={(file as any).preview}
                  alt={file.name}
                  className="h-24 w-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600"
                >
                  &times;
                </button>
                {uploadProgress[file.name] > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={handleUpload}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              disabled={files.length < minFiles}
            >
              Upload Photos
            </button>
            <p className="text-sm text-gray-500 mt-1">
              {files.length < minFiles
                ? `Please select at least ${minFiles} photos`
                : `${files.length} photos selected`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
