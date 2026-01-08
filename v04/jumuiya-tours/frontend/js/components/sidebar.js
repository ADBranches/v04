// frontend/js/components/sidebar.js
import authService from '../services/auth-service.js';
import router from '../app/router.js';

class Sidebar {
  constructor() {
    this.sidebarElement = null;
    this.isOpen = false;
    this.currentUser = null;
    
    this.init();
  }

  init() {
    this.currentUser = authService.getCurrentUser();
    this.createSidebar();
    this.bindEvents();
    this.setupAuthListener();
    
    console.log('🧭 Sidebar component initialized');
  }

  createSidebar() {
    const sidebarHTML = `
      <div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden hidden"></div>
      
      <aside id="sidebar" class="fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out z-50">
        <div class="flex flex-col h-full">
          <!-- Sidebar Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-uganda-yellow rounded-full flex items-center justify-center">
                <span class="text-uganda-black font-bold text-sm">JT</span>
              </div>
              <span class="text-lg font-display font-bold text-uganda-black">
                Jumuiya<span class="text-uganda-yellow">Tours</span>
              </span>
            </div>
            <button id="sidebar-close" class="md:hidden text-gray-500 hover:text-uganda-yellow">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- User Info -->
          <div class="p-4 border-b border-gray-200" id="sidebar-user-info">
            <!-- Dynamic user info will be inserted here -->
          </div>

          <!-- Navigation Menu -->
          <nav class="flex-1 overflow-y-auto p-4" id="sidebar-nav">
            <!-- Dynamic navigation will be inserted here -->
          </nav>

          <!-- Sidebar Footer -->
          <div class="p-4 border-t border-gray-200">
            <div class="text-xs text-gray-500 text-center">
              <p>Jumuiya Tours v1.0</p>
              <p class="mt-1">Discover Uganda</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Sidebar Toggle Button (for mobile) -->
      <button id="sidebar-toggle" 
              class="fixed bottom-4 left-4 md:hidden w-12 h-12 bg-uganda-yellow text-uganda-black rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-yellow-400 transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    `;

    // Insert sidebar at the end of body
    document.body.insertAdjacentHTML('beforeend', sidebarHTML);
    
    this.sidebarElement = document.getElementById('sidebar');
    this.overlayElement = document.getElementById('sidebar-overlay');
    this.toggleButton = document.getElementById('sidebar-toggle');
    this.closeButton = document.getElementById('sidebar-close');

    this.updateSidebarContent();
  }

  bindEvents() {
    // Toggle sidebar
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => {
        this.toggle();
      });
    }

    // Close sidebar
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.close();
      });
    }

    // Close sidebar when clicking overlay
    if (this.overlayElement) {
      this.overlayElement.addEventListener('click', () => {
        this.close();
      });
    }

    // Close sidebar on route change (mobile)
    window.addEventListener('popstate', () => {
      if (window.innerWidth < 768) {
        this.close();
      }
    });

    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        this.open(); // Always open on desktop
      } else if (this.isOpen) {
        this.close(); // Close if resizing to mobile while open
      }
    });
  }

  setupAuthListener() {
    window.addEventListener('authChange', (event) => {
      this.currentUser = authService.getCurrentUser();
      this.updateSidebarContent();
    });
  }

  updateSidebarContent() {
    this.updateUserInfo();
    this.updateNavigation();
  }

  updateUserInfo() {
    const userInfoElement = document.getElementById('sidebar-user-info');
    if (!userInfoElement) return;

    if (this.currentUser) {
      userInfoElement.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center">
            <span class="text-uganda-black font-bold text-lg">${this.currentUser.name.charAt(0).toUpperCase()}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">${this.currentUser.name}</p>
            <p class="text-xs text-gray-500 capitalize">
              ${this.currentUser.role}
              ${this.currentUser.guide_status === 'verified' ? ' • Verified' : 
                this.currentUser.guide_status === 'pending' ? ' • Pending' : ''}
            </p>
          </div>
        </div>
      `;
    } else {
      userInfoElement.innerHTML = `
        <div class="text-center">
          <p class="text-sm text-gray-600">Not logged in</p>
          <div class="mt-2 space-x-2">
            <a href="/auth/login" data-link class="text-xs text-uganda-yellow hover:underline">Login</a>
            <span class="text-gray-300">•</span>
            <a href="/auth/register" data-link class="text-xs text-uganda-yellow hover:underline">Sign Up</a>
          </div>
        </div>
      `;
    }
  }

  
  
  updateNavigation() {
    const navElement = document.getElementById('sidebar-nav');
    if (!navElement) return;

    const user = this.currentUser;
    const isAuthenticated = authService.isAuthenticated();

    let navItems = [];

    // Base navigation items for all users
    navItems.push(
      { href: '/', text: 'Home', icon: '🏠', badge: null },
      { href: '/destinations', text: 'Browse Destinations', icon: '🗺️', badge: null },
      { href: '/guides', text: 'Find Guides', icon: '👨‍🏫', badge: null },
      { href: '/about', text: 'About Uganda', icon: '🇺🇬', badge: null }
    );

    // Role-specific navigation
    if (isAuthenticated) {
      const dashboardPath = authService.getDashboardPath();
      
      // USER ROLE NAVIGATION
      if (authService.hasRole('user')) {
        navItems.push(
          { href: '/dashboard', text: 'User Dashboard', icon: '📊', badge: null },
          { href: '/bookings', text: 'My Bookings', icon: '🎫', badge: null },
          { href: '/bookings/create', text: 'Create Booking', icon: '➕', badge: null },
          { href: '/guides/apply', text: 'Become a Guide', icon: '✅', badge: null }
        );
      }

      // GUIDE ROLE NAVIGATION
      if (authService.hasRole('guide')) {
        navItems.push(
          { href: '/dashboard', text: 'Guide Dashboard', icon: '📊', badge: null },
          { href: '/destinations', text: 'My Destinations', icon: '🗺️', badge: null },
          { href: '/destinations/create', text: 'Create Destination', icon: '➕', badge: null },
          { href: '/bookings', text: 'My Bookings', icon: '🎫', badge: null }
        );
        
        // Show verification link for guides who are not yet verified
        if (user.guide_status !== 'verified') {
          navItems.push(
            { href: '/guides/verification', text: 'Verification', icon: '✅', badge: 'pending' }
          );
        }
        
        navItems.push(
          { href: '/guides/profile', text: 'Profile', icon: '👤', badge: null }
        );
      }

      // ADMIN/AUDITOR ROLE NAVIGATION
      if (authService.hasRole('admin') || authService.hasRole('auditor')) {
        navItems.push(
          { href: '/dashboard', text: 'Dashboard', icon: '📊', badge: null },
          { href: '/moderation/pending', text: 'Pending Content', icon: '⏳', badge: 'pending' },
          { href: '/destinations', text: 'All Destinations', icon: '🗺️', badge: null },
          { href: '/destinations/create', text: 'Create Destination', icon: '➕', badge: null },
          { href: '/guides/verifications', text: 'Guide Verifications', icon: '✅', badge: 'new' },
          { href: '/bookings', text: 'All Bookings', icon: '🎫', badge: null },
          { href: '/reports', text: 'Reports', icon: '📋', badge: null }
        );
}

      // ADMIN-ONLY NAVIGATION (Additional to admin/auditor)
      if (authService.hasRole('admin')) {
        navItems.push(
          { href: '/admin', text: 'Admin Dashboard', icon: '⚙️', badge: null },
          { href: '/admin/users', text: 'User Management', icon: '👥', badge: null },
          { href: '/admin/analytics', text: 'Analytics', icon: '📈', badge: null },
          { href: '/admin/roles', text: 'Role Management', icon: '🎭', badge: null },
          { href: '/admin/settings', text: 'System Settings', icon: '🔧', badge: null }
        );
      }

      // AUDITOR-ONLY NAVIGATION (Additional to admin/auditor)
      if (authService.hasRole('auditor') && !authService.hasRole('admin')) {
        navItems.push(
          { href: '/auditor/dashboard', text: 'Auditor Dashboard', icon: '🔍', badge: null },
          { href: '/auditor/content-queue', text: 'Content Queue', icon: '📋', badge: null },
          { href: '/auditor/guide-approvals', text: 'Guide Approvals', icon: '✅', badge: null },
          { href: '/moderation', text: 'Content Moderation', icon: '⚖️', badge: null },
          { href: '/audit-logs', text: 'Audit Logs', icon: '📝', badge: null }
        );
      }

      // Common authenticated user items (for all roles)
      navItems.push(
        { href: '/profile', text: 'My Profile', icon: '👤', badge: null },
        { href: '/settings', text: 'Settings', icon: '⚙️', badge: null },
        { href: '/help', text: 'Help & Support', icon: '❓', badge: null }
      );

    } else {
      // Public user items
      navItems.push(
        { href: '/auth/login', text: 'Login', icon: '🔐', badge: null },
        { href: '/auth/register', text: 'Create Account', icon: '👤', badge: null }
      );
    }

    // Render navigation items
    navElement.innerHTML = `
      <div class="space-y-2">
        ${navItems.map(item => this.renderNavItem(item)).join('')}
      </div>
    `;

    this.highlightActiveRoute();
  }

  renderNavItem(item) {
    const badgeHTML = item.badge ? `
      <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-uganda-yellow rounded-full">
        ${item.badge === 'pending' ? '!' : 'New'}
      </span>
    ` : '';

    return `
      <a href="${item.href}" 
         data-link
         class="sidebar-nav-item flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-700 hover:text-uganda-yellow hover:bg-uganda-yellow/10 group">
        <div class="flex items-center space-x-3">
          <span class="text-lg">${item.icon}</span>
          <span>${item.text}</span>
        </div>
        ${badgeHTML}
      </a>
    `;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.sidebarElement.classList.remove('-translate-x-full');
    this.overlayElement.classList.remove('hidden');
    this.isOpen = true;
    
    // Add body lock to prevent scrolling
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.sidebarElement.classList.add('-translate-x-full');
    this.overlayElement.classList.add('hidden');
    this.isOpen = false;
    
    // Remove body lock
    document.body.style.overflow = '';
  }

  highlightActiveRoute() {
    const currentPath = window.location.pathname;
    
    // Remove active class from all items
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.classList.remove('text-uganda-yellow', 'bg-uganda-yellow/10', 'border-r-2', 'border-uganda-yellow');
      item.classList.add('text-gray-700');
    });

    // Add active class to current route
    const activeItem = document.querySelector(`.sidebar-nav-item[href="${currentPath}"]`);
    if (activeItem) {
      activeItem.classList.remove('text-gray-700');
      activeItem.classList.add('text-uganda-yellow', 'bg-uganda-yellow/10', 'border-r-2', 'border-uganda-yellow');
    }
  }

  // Update badge counts (can be called from other components)
  updateBadge(route, count) {
    const navItem = document.querySelector(`.sidebar-nav-item[href="${route}"]`);
    if (navItem) {
      let badge = navItem.querySelector('.badge');
      
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'badge inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-uganda-yellow rounded-full';
          navItem.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : count.toString();
      } else if (badge) {
        badge.remove();
      }
    }
  }

  // Show loading state
  showLoading() {
    const navElement = document.getElementById('sidebar-nav');
    if (navElement) {
      navElement.innerHTML = `
        <div class="space-y-2">
          ${Array.from({ length: 5 }, (_, i) => `
            <div class="animate-pulse flex items-center space-x-3 px-3 py-2">
              <div class="w-6 h-6 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded flex-1"></div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = new Sidebar();
  
  // Make sidebar globally available
  window.sidebar = sidebar;
  
  // Highlight active route on navigation
  router.addRouteChangeListener(() => {
    sidebar.highlightActiveRoute();
  });
});

export default Sidebar;
