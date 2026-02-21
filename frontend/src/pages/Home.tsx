import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';

export const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Our App
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            A modern web application built with React, FastAPI, and PostgreSQL.
            Sign up to get started or login to continue.
          </p>

          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button variant="primary" className="text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Fast & Modern</h3>
              <p className="text-gray-600">
                Built with the latest technologies for optimal performance
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure</h3>
              <p className="text-gray-600">
                JWT authentication with Google OAuth integration
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Easy to Deploy</h3>
              <p className="text-gray-600">
                Docker-ready for seamless deployment anywhere
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
