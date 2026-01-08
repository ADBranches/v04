// frontend/js/app/router.js
const componentMap = {
    'home/home': () => import('../pages/home/home.js'),
    'auth/login': () => import('../pages/auth/login.js'),
    'auth/register': () => import('../pages/auth/register.js'),
    'errors/404': () => import('../pages/errors/404.js'),
    'errors/500': () => import('../pages/errors/500.js'),
    'dashboard/user-dashboard': () => import('../pages/dashboard/user-dashboard.js'),
    'bookings/list': () => import('../pages/bookings/booking-list.js'),
    'bookings/create': () => import('../pages/bookings/booking-create.js'),
    'bookings/detail': () => import('../pages/bookings/booking-manage.js'),
    'destinations/list': () => import('../pages/destinations/destination-list.js'),
    'destinations/detail': () => import('../pages/destinations/destination-view.js'),
    'destinations/create': () => import('../pages/destinations/destination-create.js'),
    'guides/list': () => import('../pages/guides/guide-list.js'),
    // 'guides/apply': () => import('../pages/guides/guide-application.js'),
    'guides/verification': () => import('../pages/guides/guide-verification.js'),
    // 'profile/user-profile': () => import('../pages/profile/user-profile.js'),
    // 'admin/dashboard': () => import('../pages/admin/admin-dashboard.js'),
    'admin/user-management': () => import('../pages/admin/user-management.js'),
    'moderation/pending-content': () => import('../pages/moderation/pending-content.js'),
};

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
        this.rootElement = document.getElementById('app') || document.body;
        this.routeChangeListeners = [];
        this.middleware = null;
        
        // DEBUG: Log routes after they're defined
        setTimeout(() => {
            console.log('🔄 Registered routes:', Object.keys(this.routes));
        }, 100);
        // Bind methods
        this.navigate = this.navigate.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
        
        // Initialize
        // this.init();
    }

    init() {
        console.log('🔄 Router init called');
        console.log('🔍 Root element in init:', this.rootElement);
        console.log('🔍 Root element exists:', !!document.getElementById('app'));
        
        // Add event listener for popstate (browser back/forward)
        window.addEventListener('popstate', this.handlePopState);
        
        // Add click listener for internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                this.navigate(link.getAttribute('href') || link.pathname);
            }
        });

        // Load initial route
        this.loadInitialRoute();
    }

    // ✅ FROM FIRST ROUTER: Simple route addition with auth
    addRoute(path, component, authRequired = false) {
        console.log(`🔄 Adding route: ${path} -> ${component}, auth: ${authRequired}`);
        this.routes[path] = {
            component,
            authRequired
        };
    }

    // ✅ FROM SECOND ROUTER: Route change listeners
    addRouteChangeListener(listener) {
        if (typeof listener === 'function') {
            this.routeChangeListeners.push(listener);
        }
    }

    removeRouteChangeListener(listener) {
        const index = this.routeChangeListeners.indexOf(listener);
        if (index > -1) {
            this.routeChangeListeners.splice(index, 1);
        }
    }

    notifyRouteChangeListeners() {
        this.routeChangeListeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('Error in route change listener:', error);
            }
        });
    }

    // ✅ FROM FIRST ROUTER: Middleware support
    setMiddleware(middleware) {
        this.middleware = middleware;
        console.log('✅ Middleware set on router');
    }

    // ✅ COMBINED: Enhanced route loading with auth check
    async loadRoute(path) {
        console.log('🔄 loadRoute called with path:', path);

        // FIX: Better path normalization
        let cleanPath = path;
        
        // Remove trailing slashes but keep leading slash for root
        if (path !== '/') {
            cleanPath = path.replace(/\/+$/, '');
        }
        
        // Ensure paths without leading slash still match routes with leading slash
        if (cleanPath !== '/' && !cleanPath.startsWith('/')) {
            cleanPath = '/' + cleanPath;
        }
        
        console.log('🔄 Cleaned path:', cleanPath);

        const route = this.findMatchingRoute(cleanPath);
        console.log('🔄 Found route:', route);
        
        if (!route) {
            console.log('❌ No route found, showing 404');
            this.show404();
            return;
        }

        // ✅ FROM FIRST ROUTER: Authentication check
        if (route.authRequired && this.middleware) {
            console.log('🔐 Route requires auth, checking...');
            const isAuthenticated = await this.middleware.checkAuth();
            if (!isAuthenticated) {
                console.log('❌ Auth failed, redirecting to login');
                this.navigate('/auth/login');
                return;
            }
            console.log('✅ Auth successful');
        }

        await this.renderComponent(route.component, cleanPath);
    }

    // ✅ FROM FIRST ROUTER: Component rendering
    async renderComponent(componentPath, currentPath) {
        console.log('🔄 renderComponent called:', componentPath);
        console.log('🔍 Checking componentMap for:', componentPath);
        console.log('🔍 Available in componentMap:', Object.keys(componentMap));

        try {
            // Use the import map instead of dynamic template literal
            const importFn = componentMap[componentPath];
            if (!importFn) {
                throw new Error(`No import function for: ${componentPath}`);
            }
            
            console.log('📦 Importing component module...');
            const module = await importFn();
            console.log('✅ Component module loaded:', module);
            console.log('🔍 Module render function exists:', typeof module.render === 'function');
            console.log('Module Keys:', Object.keys(module));
            
             if (typeof module.render !== 'function') {
                throw new Error(`Component ${componentPath} does not export a render function. Exports: ${Object.keys(module)}`);
            }
            console.log('🎨 Rendering component to DOM...');
            this.rootElement.innerHTML = await module.render();
            console.log('✅ Component rendered to DOM');
            
            // Update current route and history
            this.currentRoute = currentPath;
            if (currentPath !== window.location.pathname) {
                window.history.pushState({}, '', currentPath);
            }
            
            // Call afterRender if exists
            if (module.afterRender) {
                console.log('🔧 Calling afterRender...');
                module.afterRender();
            }
            
            this.updateActiveNav(currentPath);
            this.notifyRouteChangeListeners();
            
        } catch (error) {
            console.error('❌ Import failed for path:', componentPath);
            console.error('❌ Error details:', error);
            this.show500();
        }
    }

    // ✅ FROM SECOND ROUTER: Route matching with params
    findMatchingRoute(path) {
        console.log('🔄 findMatchingRoute searching for:', path);
        console.log('🔄 Available routes:', Object.keys(this.routes));
        
        // Normalize the search path to match route definitions
        const searchPath = path === '' ? '/' : path;
        
        // Exact match - this should work for '/'
        if (this.routes[searchPath]) {
            console.log('✅ Exact match found for:', searchPath);
            return { ...this.routes[searchPath], originalPath: searchPath };
        }
        
        // For root path specifically
        if (searchPath === '/' && this.routes['/']) {
            console.log('✅ Root path match');
            return { ...this.routes['/'], originalPath: '/' };
        }
        
        // Parametric routes (e.g., /destinations/:id)
        for (const routePath in this.routes) {
            if (routePath.includes(':')) {
                const routePattern = '^' + routePath.replace(/:\w+/g, '([^/]+)') + '$';
                const regex = new RegExp(routePattern);
                if (regex.test(searchPath)) {
                    console.log('✅ Parametric match found:', routePath);
                    return { 
                        ...this.routes[routePath], 
                        originalPath: routePath,
                        params: this.extractParams(routePath, searchPath)
                    };
                }
            }
        }
        
        console.log('❌ No match found for:', searchPath);
        return null;
    }

    // ✅ FROM SECOND ROUTER: Navigation methods
    navigate(path) {
        console.log('🧭 Navigating to:', path);
        this.loadRoute(path);
    }

    handlePopState() {
        console.log('↩️ Popstate event, loading:', window.location.pathname);
        this.loadRoute(window.location.pathname);
    }

    loadInitialRoute() {
        const initialPath = window.location.pathname;
        console.log('🚀 Loading initial route:', initialPath);
        this.loadRoute(initialPath);
    }

    // ✅ FROM SECOND ROUTER: Active nav updating
    updateActiveNav(currentPath) {
        document.querySelectorAll('[data-nav]').forEach(item => {
            item.classList.remove('active');
        });
        
        const currentNav = document.querySelector(`[href="${currentPath}"]`);
        if (currentNav) {
            currentNav.classList.add('active');
        }
    }

    // ✅ FROM SECOND ROUTER: Parameter extraction
    extractParams(routePath, currentPath) {
        const params = {};
        const routeParts = routePath.split('/');
        const pathParts = currentPath.split('/');
        
        routeParts.forEach((part, index) => {
            if (part.startsWith(':')) {
                const paramName = part.slice(1);
                params[paramName] = pathParts[index];
            }
        });
        
        return params;
    }

    // ✅ FROM SECOND ROUTER: Current route info
    getCurrentRoute() {
        const route = this.findMatchingRoute(this.currentRoute);
        return {
            path: this.currentRoute,
            params: route?.params || {}
        };
    }

    // ✅ FROM BOTH: Error pages
    show404() {
        console.log('❓ Showing 404 page');
        this.rootElement.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-safari-sand">
                <div class="text-center">
                    <h1 class="text-6xl font-bold text-uganda-yellow mb-4">404</h1>
                    <h2 class="text-2xl font-semibold text-uganda-black mb-4">Page Not Found</h2>
                    <p class="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
                    <button onclick="router.navigate('/')" 
                            class="bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors">
                        Go Home
                    </button>
                </div>
            </div>
        `;
        this.notifyRouteChangeListeners();
    }

    show500() {
        console.log('💥 Showing 500 page');
        this.rootElement.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-safari-sand">
                <div class="text-center">
                    <h1 class="text-6xl font-bold text-uganda-red mb-4">500</h1>
                    <h2 class="text-2xl font-semibold text-uganda-black mb-4">Server Error</h2>
                    <p class="text-gray-600 mb-8">Something went wrong on our end.</p>
                    <button onclick="router.navigate('/')" 
                            class="bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors">
                        Go Home
                    </button>
                </div>
            </div>
        `;
        this.notifyRouteChangeListeners();
    }

    // Add this method to Router class
    start() {
        console.log('🚀 Starting router...');
        this.init();
        console.log('✅ Router started with routes:', Object.keys(this.routes));
    }
}

// Create global router instance
console.log('🔧 Creating router instance...');
const router = new Router();

// Define routes - MOVE catch-all route to the END
console.log('🗺️ Defining routes...');
router.addRoute('/', 'home/home', false);
router.addRoute('/auth/login', 'auth/login', false);
router.addRoute('/auth/register', 'auth/register', false);
router.addRoute('/dashboard', 'dashboard/user-dashboard', true);
router.addRoute('/bookings', 'bookings/list', true);
router.addRoute('/bookings/create', 'bookings/create', true);
router.addRoute('/bookings/:id', 'bookings/detail', true);
router.addRoute('/destinations', 'destinations/list', false);
router.addRoute('/destinations/:id', 'destinations/detail', false);
router.addRoute('/destinations/create', 'destinations/create', true);
router.addRoute('/guides', 'guides/list', false);
router.addRoute('/guides/apply', 'guides/apply', true);
router.addRoute('/guides/verification', 'guides/verification', true);
router.addRoute('/profile', 'profile/user-profile', true);
router.addRoute('/admin', 'admin/dashboard', true);
router.addRoute('/admin/users', 'admin/user-management', true);
router.addRoute('/moderation/pending', 'moderation/pending-content', true);
router.addRoute('/404', 'errors/404', false);
router.addRoute('/500', 'errors/500', false);
// Catch-all route should be LAST
router.addRoute('*', 'errors/404', false);

// Add debug logging after route definitions
console.log('🔍 Router instance created:', router);
console.log('🔍 Available routes:', Object.keys(router.routes));
console.log('🔍 Root element exists:', !!document.getElementById('app'));
console.log('🔍 Component map keys:', Object.keys(componentMap));

// Test if we can access the router globally
window.debugRouter = router;

export default router;
