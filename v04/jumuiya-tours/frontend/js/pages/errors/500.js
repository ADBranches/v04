export async function render() {
    return `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
            <div class="text-center max-w-md mx-auto p-8">
                <div class="text-9xl font-bold text-uganda-red mb-4">500</div>
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Server Error</h1>
                <p class="text-gray-600 mb-8 text-lg">
                    Something went wrong on our end. Please try again later.
                </p>
                <div class="space-y-4">
                    <a href="/" data-link 
                       class="inline-block bg-uganda-yellow text-uganda-black px-8 py-3 rounded-full font-bold hover:bg-yellow-400 transition-colors w-full">
                        Go Home
                    </a>
                    <button onclick="window.location.reload()" 
                            class="inline-block border-2 border-uganda-red text-uganda-red px-8 py-3 rounded-full font-bold hover:bg-uganda-red hover:text-white transition-colors w-full">
                        Try Again
                    </button>
                    <a href="mailto:support@jumuiyatours.com"
                       class="text-uganda-red hover:text-red-600 font-semibold transition-colors">
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    `;
}