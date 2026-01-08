import { Link } from 'react-router-dom';

export default function ServerError() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-9xl font-bold text-uganda-red mb-4">500</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Server Error</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Something went wrong on our end. Please try again later.
        </p>
        <div className="space-y-4">
          <Link 
            to="/"
            className="inline-block bg-uganda-yellow text-uganda-black px-8 py-3 rounded-full font-bold hover:bg-yellow-400 transition-colors w-full"
          >
            Go Home
          </Link>
          <button 
            onClick={handleRetry}
            className="inline-block border-2 border-uganda-red text-uganda-red px-8 py-3 rounded-full font-bold hover:bg-uganda-red hover:text-white transition-colors w-full"
          >
            Try Again
          </button>
          <a 
            href="mailto:support@jumuiyatours.com"
            className="text-uganda-red hover:text-red-600 font-semibold transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}