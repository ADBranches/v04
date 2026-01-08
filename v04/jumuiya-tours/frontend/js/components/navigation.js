// frontend/js/components/navigation.js
import {authService} from '../services/auth-service.js';
import router from '../app/router.js';

class Navigation {
  constructor() {
    this.navElement = null;
    this.mobileMenuButton = null;
    this.mobileMenu = null;
    this.userMenu = null;
    
    this.init();
  }

  init() {
    this.createNavigation();
    this.bindEvents();
    this.setupAuthListener();
    
    console.log('🧭 Navigation component initialized');
  }

  createNavigation() {
    const navHTML = `
      <nav class="bg-white shadow-lg border-b border-uganda-yellow/20 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Logo -->
            <div class="flex items-center space-x-2">
              <a href="/" data-link class="flex items-center space-x-2 group">
                <div class="w-8 h-8 bg-uganda-yellow rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span class="text-uganda-black font-bold text-sm">JT</span>
                </div>
                <span class="text-lg font-display font-bold text-uganda-black hidden sm:block">
                  Jumuiya<span class="text-uganda-yellow">Tours</span>
                </span>
              </a>
            </div>

            <!-- Desktop Menu -->
            <div class="hidden md:flex items-center space-x-8" id="desktop-menu">
              <!-- Dynamic menu items will be inserted here -->
            </div>

            <!-- User Menu & Auth -->
            <div class="flex items-center space-x-4" id="nav-auth-buttons"></div>

            <!-- Mobile menu button -->
            <div class="md:hidden">
              <button type="button" 
                      id="mobile-menu-button"
                      class="bg-white inline-flex items-center justify-center p-2 rounded-md text-uganda-black hover:text-uganda-yellow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-uganda-yellow"
                      aria-expanded="false">
                <span class="sr-only">Open main menu</span>
                <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg class="hidden h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile menu -->
        <div class="hidden md:hidden bg-white border-t border-gray-200" id="mobile-menu">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <!-- Dynamic mobile menu items will be inserted here -->
          </div>
        </div>
      </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navHTML);
    
    this.navElement = document.querySelector('nav');
    this.mobileMenuButton = document.getElementById('mobile-menu-button');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.userMenu = document.getElementById('nav-auth-buttons'); // Changed to nav-auth-buttons for compatibility

    this.updateNavigation();
  }

  bindEvents() {
    if (this.mobileMenuButton) {
      this.mobileMenuButton.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    document.addEventListener('click', (event) => {
      if (this.mobileMenu && this.mobileMenuButton && !this.navElement.contains(event.target)) {
        this.closeMobileMenu();
      }
    });

    window.addEventListener('popstate', () => {
      this.closeMobileMenu();
      this.highlightActiveRoute();
    });
  }

  setupAuthListener() {
    window.addEventListener('authChange', () => {
      this.updateNavigation();
    });dashboardPath
  }

  updateNavigation() {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    
    this.updateMenuItems(user, isAuthenticated);
    this.updateUserMenu(user, isAuthenticated);
  }

  updateMenuItems(user, isAuthenticated) {
    const desktopMenu = document.getElementById('desktop-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (!desktopMenu || !mobileMenu) return;

    const commonItems = [
      { href: '/destinations', text: 'Destinations', icon: '🗺️' },
      { href: '/guides', text: 'Guides', icon: '👨‍🏫' },
      { href: '/bookings', text: 'Bookings', icon: '📅' },
    ];

    let roleItems = [];
    if (isAuthenticated) {
      const dashboardPath = authService.getDashboardPath ? authService.getDashboardPath() : '/dashboard';
      roleItems.push({ href: dashboardPath, text: 'Dashboard', icon: '📊' });

      if (authService.hasRole && (authService.hasRole('guide') || authService.hasRole('auditor') || authService.hasRole('admin'))) {
        roleItems.push({ href: '/destinations/create', text: 'Create Destination', icon: '➕' });
      }

      if (authService.hasRole && (authService.hasRole('auditor') || authService.hasRole('admin'))) {
        roleItems.push({ href: '/moderation', text: 'Moderation', icon: '⚖️' });
      }

      if (authService.hasRole && authService.hasRole('auditor')) {
        roleItems.push(
          { href: '/auditor/dashboard', text: 'Auditor Dashboard', icon: '🔍' },
          { href: '/auditor/content-queue', text: 'Content Queue', icon: '📋' },
          { href: '/auditor/guide-approvals', text: 'Guide Approvals', icon: '✅' }
        );
      }

      if (authService.hasRole && authService.hasRole('admin')) {
        // Add admin-specific links
        roleItems.push(
          { href: '/admin/users', text: 'Users', icon: '👥' },
          { href: '/admin/analytics', text: 'Analytics', icon: '📈' },
          { href: '/admin', text: 'Admin Panel', icon: '⚙️' }
        );
      }
    } else {
      roleItems.push(
        { href: '/auth/login', text: 'Login', icon: '🔐' },
        { href: '/auth/register', text: 'Sign Up', icon: '👤' }
      );
    }

    const allItems = [...commonItems, ...roleItems];

    desktopMenu.innerHTML = allItems.map(item => `
      <a href="${item.href}" 
        data-link
        class="text-uganda-black hover:text-uganda-yellow px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 font-african">
        <span>${item.icon}</span>
        <span>${item.text}</span>
      </a>
    `).join('');

    mobileMenu.innerHTML = allItems.map(item => `
      <a href="${item.href}" 
        data-link
        class="text-uganda-black hover:text-uganda-yellow hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-2 font-african">
        <span class="text-lg">${item.icon}</span>
        <span>${item.text}</span>
      </a>
    `).join('');
  }

  updateUserMenu(user, isAuthenticated) {
    if (!this.userMenu) return;

    if (isAuthenticated && user) {
      this.userMenu.innerHTML = `
        <div class="relative" id="user-dropdown-container">
          <button type="button" 
                  id="user-menu-button"
                  class="flex items-center space-x-2 bg-gray-100 rounded-full p-1 text-sm focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:ring-offset-2">
            <div class="w-8 h-8 bg-uganda-yellow rounded-full flex items-center justify-center">
              <span class="text-uganda-black font-bold text-xs">${user.name.charAt(0).toUpperCase()}</span>
            </div>
            <span class="text-uganda-black font-medium hidden sm:block font-african">${user.name}</span>
            <svg class="w-4 h-4 text-uganda-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div id="user-dropdown" 
              class="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div class="py-1" role="none">
              <div class="px-4 py-2 text-sm text-gray-700 border-b">
                <div class="font-medium font-african">${user.name}</div>
                <div class="text-gray-500 capitalize font-african">${user.role}${user.guide_status === 'verified' ? ' ✓' : ''}</div>
              </div>
              <a href="${authService.getDashboardPath ? authService.getDashboardPath() : '/dashboard'}" 
                data-link
                class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-african">
                <span>📊</span>
                <span>Dashboard</span>
              </a>
              <a href="/profile" 
                data-link
                class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-african">
                <span>👤</span>
                <span>Profile</span>
              </a>
              ${user.role === 'user' ? `
                <a href="/guides/apply" 
                  data-link
                  class="flex items-center space-x-2 px-4 py-2 text-sm text-uganda-yellow hover:bg-gray-100 font-african">
                  <span>🌟</span>
                  <span>Become a Guide</span>
                </a>
              ` : ''}
              ${user.role === 'guide' && user.guide_status !== 'verified' ? `
                <a href="/guides/verification" 
                  data-link
                  class="flex items-center space-x-2 px-4 py-2 text-sm text-uganda-yellow hover:bg-gray-100 font-african">
                  <span>📝</span>
                  <span>Submit Verification</span>
                </a>
              ` : ''}
              ${user.role === 'auditor' ? `
                <div class="border-t"></div>
                <div class="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide font-african">Auditor</div>
                <a href="/auditor/dashboard" 
                  data-link
                  class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-african">
                  <span>🔍</span>
                  <span>Auditor Dashboard</span>
                </a>
                <a href="/auditor/content-queue" 
                  data-link
                  class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-african">
                  <span>📋</span>
                  <span>Content Queue</span>
                </a>
                <a href="/auditor/guide-approvals" 
                  data-link
                  class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-african">
                  <span>✅</span>
                  <span>Guide Approvals</span>
                </a>
              ` : ''}
              ${user.role === 'admin' ? `
                <div class="border-t"></div>
                <div class="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide font-african">Admin</div>
                <a href="/admin/users" 
                  data-link
                  class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-african">
                  <span>👥</span>
                  <span>User Management</span>
                </a>
                <a href="/admin/analytics" 
                  data-link
                  class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-african">
                  <span>📈</span>
                  <span>Analytics</span>
                </a>
                <a href="/admin" 
                  data-link
                  class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-african">
                  <span>⚙️</span>
                  <span>Admin Panel</span>
                </a>
              ` : ''}
              <div class="border-t"></div>
              <button type="button" 
                      onclick="authService.logout(); router.navigate('/auth/login')"
                      class="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-uganda-red hover:bg-gray-100 font-african">
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      `;
      this.setupUserDropdown();
    } else {
      this.userMenu.innerHTML = `
        <div class="flex items-center space-x-2">
          <a href="/auth/login" 
            data-link
            class="text-uganda-black hover:text-uganda-yellow px-3 py-2 rounded-md text-sm font-medium transition-colors font-african">
            Login
          </a>
          <a href="/auth/register" 
            data-link
            class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-400 transition-colors font-display">
            Sign Up
          </a>
        </div>
      `;
    }
  }

  setupUserDropdown() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#user-dropdown-container')) {
          userDropdown.classList.add('hidden');
        }
      });

      window.addEventListener('popstate', () => {
        userDropdown.classList.add('hidden');
      });
    }
  }

  toggleMobileMenu() {
    const isExpanded = this.mobileMenuButton.getAttribute('aria-expanded') === 'true';
    
    this.mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
    this.mobileMenu.classList.toggle('hidden');
    
    const menuIcon = this.mobileMenuButton.querySelector('svg:first-child');
    const closeIcon = this.mobileMenuButton.querySelector('svg:last-child');
    
    menuIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
  }

  closeMobileMenu() {
    this.mobileMenuButton.setAttribute('aria-expanded', 'false');
    this.mobileMenu.classList.add('hidden');
    
    const menuIcon = this.mobileMenuButton.querySelector('svg:first-child');
    const closeIcon = this.mobileMenuButton.querySelector('svg:last-child');
    
    menuIcon.classList.remove('hidden');
    closeIcon.classList.add('hidden');
  }

  showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.nav-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `nav-notification fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ${
      type === 'error' ? 'bg-uganda-red text-white' :
      type === 'success' ? 'bg-safari-forest text-white' :
      'bg-uganda-yellow text-uganda-black'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-african">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current hover:opacity-70">
          ×
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  highlightActiveRoute() {
    const currentPath = window.location.pathname;
    
    document.querySelectorAll('[data-link]').forEach(link => {
      link.classList.remove('text-uganda-yellow', 'bg-uganda-yellow/10');
      link.classList.add('text-uganda-black');
    });

    const activeLink = document.querySelector(`[href="${currentPath}"]`);
    if (activeLink) {
      activeLink.classList.remove('text-uganda-black');
      activeLink.classList.add('text-uganda-yellow', 'bg-uganda-yellow/10');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const navigation = new Navigation();
  window.navigation = navigation;
  
  if (router.addRouteChangeListener) {
    router.addRouteChangeListener(() => {
      navigation.highlightActiveRoute();
      navigation.closeMobileMenu();
    });
  }
});

export default Navigation;
