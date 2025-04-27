import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import ImageUploader from '../components/ImageUploader';

const HomePage: React.FC = () => {
  // Get authentication state from Clerk
  const { isLoaded, isSignedIn, userId } = useAuth();
  const isAuthenticated = isLoaded && isSignedIn && !!userId;

  const handleUploadComplete = (files: File[]) => {
    // In a real app, this would navigate to the order page
    // or handle the upload in some way
    console.log('Uploaded files:', files);
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold text-center max-w-4xl leading-tight">
            Turn Your Favorite Photos Into a Customized Coloring Book
          </h1>
          <p className="mt-6 text-xl text-center max-w-3xl">
            Transform your cherished memories into a unique coloring experience.
            Perfect for gifts, creative relaxation, or preserving special moments.
          </p>
          <div className="mt-10">
            {isAuthenticated ? (
              <Link
                to="/create"
                className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium text-lg hover:bg-blue-50 transition"
              >
                Create Your Coloring Book
              </Link>
            ) : (
              <Link
                to="/signup"
                className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium text-lg hover:bg-blue-50 transition"
              >
                Sign Up and Get Started
              </Link>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 w-full">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 50L48 50C96 50 192 50 288 56.7C384 63.3 480 76.7 576 73.3C672 70 768 50 864 40C960 30 1056 30 1152 40C1248 50 1344 70 1392 80L1440 90V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Photos</h3>
              <p className="text-gray-600">
                Select {import.meta.env.VITE_MIN_IMAGES_REQUIRED || '8'}-24 of your favorite photos to transform into coloring pages.
                Family portraits, vacations, pets - any photo will work!
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Automatic Conversion</h3>
              <p className="text-gray-600">
                Our AI technology transforms your photos into beautiful line drawings,
                perfect for coloring, while preserving the essence of your memories.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Receive Your Coloring Book</h3>
              <p className="text-gray-600">
                Choose a digital download or have a physical book printed and delivered
                to your door. Start coloring your memories!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-6">
            Create Your Coloring Book
          </h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-10">
            Upload between {import.meta.env.VITE_MIN_IMAGES_REQUIRED || '8'} and 24 photos to get started. We accept JPG and PNG files.
            {!isAuthenticated && " Please sign in to continue."}
          </p>

          <div className="max-w-4xl mx-auto">
            <ImageUploader
              maxFiles={24}
              minFiles={parseInt(import.meta.env.VITE_MIN_IMAGES_REQUIRED || '8', 10)}
              isDisabled={!isAuthenticated}
              onUploadComplete={handleUploadComplete}
            />

            {!isAuthenticated && (
              <div className="mt-6 text-center">
                <Link
                  to="/signin"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition"
                >
                  Sign In to Upload
                </Link>
                <p className="mt-2 text-sm text-gray-500">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-blue-600 hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  JD
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Jane Doe</h4>
                  <div className="flex text-yellow-400">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "I made a coloring book of our family vacation for my kids. They love coloring
                their own memories! The quality is excellent and the conversion to line art is amazing."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  MS
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Michael Smith</h4>
                  <div className="flex text-yellow-400">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "I created a coloring book for my grandmother with photos of the whole family.
                It was the perfect gift for someone who loves both memories and staying creative!"
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  LJ
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Lisa Johnson</h4>
                  <div className="flex text-yellow-400">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "The paper quality for the physical book is excellent. The lines are clear and easy
                to color. I've ordered three different books already and will definitely order more!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Create Your Coloring Book?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Turn your memories into a unique creative experience that you can enjoy again and again.
          </p>
          <Link
            to={isAuthenticated ? "/create" : "/signup"}
            className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium text-lg hover:bg-blue-50 transition"
          >
            {isAuthenticated ? "Create Now" : "Get Started Today"}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
