import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-9xl font-bold text-uganda-yellow mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8 text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-4">
          <Link 
            to="/"
            className="inline-block bg-uganda-yellow text-uganda-black px-8 py-3 rounded-full font-bold hover:bg-yellow-400 transition-colors w-full"
          >
            Go Home
          </Link>
          <Link 
            to="/destinations"
            className="inline-block border-2 border-uganda-yellow text-uganda-black px-8 py-3 rounded-full font-bold hover:bg-uganda-yellow transition-colors w-full"
          >
            Explore Destinations
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="text-uganda-yellow hover:text-yellow-400 font-semibold transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}