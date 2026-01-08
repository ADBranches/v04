export async function render() {
    return `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div class="text-center max-w-md mx-auto p-8">
                <div class="text-9xl font-bold text-uganda-yellow mb-4">404</div>
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p class="text-gray-600 mb-8 text-lg">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div class="space-y-4">
                    <a href="/" data-link 
                       class="inline-block bg-uganda-yellow text-uganda-black px-8 py-3 rounded-full font-bold hover:bg-yellow-400 transition-colors w-full">
                        Go Home
                    </a>
                    <a href="/destinations" data-link
                       class="inline-block border-2 border-uganda-yellow text-uganda-black px-8 py-3 rounded-full font-bold hover:bg-uganda-yellow transition-colors w-full">
                        Explore Destinations
                    </a>
                    <button onclick="history.back()" 
                            class="text-uganda-yellow hover:text-yellow-400 font-semibold transition-colors">
                        ← Go Back
                    </button>
                </div>
            </div>
        </div>
    `;
}