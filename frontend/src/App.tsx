import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CreateOrderPage from './pages/CreateOrderPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';

// Get Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'test_clerk_key';

// Protected route component using Clerk
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, userId } = useAuth();

  // Wait for authentication to load
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<HomePage />} />

            {/* Auth routes with Clerk components */}
            <Route
              path="signin"
              element={
                <div className="container mx-auto py-16 px-4">
                  <SignIn routing="path" path="/signin" />
                </div>
              }
            />
            <Route
              path="signup"
              element={
                <div className="container mx-auto py-16 px-4">
                  <SignUp routing="path" path="/signup" />
                </div>
              }
            />

            {/* Protected routes */}
            <Route
              path="create"
              element={
                <ProtectedRoute>
                  <CreateOrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <div className="container mx-auto py-16 px-4">
                    <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
                    <p>This would be the user dashboard with order history, etc.</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="confirmation" element={<OrderConfirmationPage />} />

            {/* Additional pages */}
            <Route path="about" element={<div className="container mx-auto py-16 px-4">How It Works Page</div>} />
            <Route path="contact" element={<div className="container mx-auto py-16 px-4">Contact Us Page</div>} />
            <Route path="terms" element={<div className="container mx-auto py-16 px-4">Terms of Service Page</div>} />

            {/* 404 catch-all */}
            <Route path="*" element={
              <div className="container mx-auto py-16 px-4 text-center">
                <h1 className="text-3xl font-bold mb-6">404 - Page Not Found</h1>
                <p className="mb-6">The page you are looking for doesn't exist or has been moved.</p>
                <a href="/" className="text-blue-600 hover:underline">Return to Home</a>
              </div>
            } />
          </Route>
        </Routes>
      </Router>
    </ClerkProvider>
  );
}

export default App;
