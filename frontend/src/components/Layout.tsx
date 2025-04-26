import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">Photo Coloring Book</Link>
          <nav>
            <ul className="flex space-x-6">
              <li><Link to="/" className="hover:text-blue-200">Home</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link></li>
              <li><Link to="/about" className="hover:text-blue-200">How It Works</Link></li>
            </ul>
          </nav>
          <div className="flex items-center space-x-4">
            {/* These would be replaced with real auth buttons from Clerk */}
            <button className="px-4 py-2 bg-white text-blue-600 rounded hover:bg-blue-50 transition">Sign In</button>
            <button className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition">Sign Up</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">Photo Coloring Book</h3>
              <p className="text-gray-400">Turn Your Favorite Photos Into a Customized Coloring Book</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white">Home</Link></li>
                <li><Link to="/about" className="hover:text-white">How It Works</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Photo Coloring Book. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
