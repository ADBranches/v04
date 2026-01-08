# 🏗️ Project Structure for Jumuiya Tours RBAC Platform

I'll recommend a **monolithic architecture** since this is a tourism platform with tightly coupled components (users, bookings, content) that need to share data and authentication. Microservices would be overkill for this scale.

## 📁 **Project Tree Structure**

```
jumuiya-tours/
├── 📄 index.html
├── 🎨 styles/
│   ├── tailwind.css
│   ├── components/
│   │   ├── navigation.css
│   │   ├── forms.css
│   │   └── modals.css
│   └── pages/
│       ├── dashboard.css
│       ├── auth.css
│       └── admin.css
├── ⚡ js/
│   ├── app/
│   │   ├── auth.js
│   │   ├── api.js
│   │   ├── router.js
│   │   ├── store.js
│   │   └── utils.js
│   ├── middleware/
│   │   ├── auth-middleware.js
│   │   ├── permission-middleware.js
│   │   └── role-middleware.js
│   ├── services/
│   │   ├── auth-service.js
│   │   ├── user-service.js
│   │   ├── destination-service.js
│   │   ├── booking-service.js
│   │   └── guide-service.js
│   ├── components/
│   │   ├── navigation.js
│   │   ├── modal.js
│   │   ├── form-validator.js
│   │   └── notification.js
│   └── pages/
│       ├── auth/
│       │   ├── login.js
│       │   └── register.js
│       ├── dashboard/
│       │   ├── admin-dashboard.js
│       │   ├── auditor-dashboard.js
│       │   ├── guide-dashboard.js
│       │   └── user-dashboard.js
│       ├── admin/
│       │   ├── user-management.js
│       │   ├── role-management.js
│       │   └── system-analytics.js
│       ├── destinations/
│       │   ├── destination-list.js
│       │   ├── destination-create.js
│       │   ├── destination-edit.js
│       │   └── destination-view.js
│       ├── guides/
│       │   ├── guide-list.js
│       │   ├── guide-verification.js
│       │   └── guide-profile.js
│       └── bookings/
│           ├── booking-list.js
│           ├── booking-create.js
│           └── booking-manage.js
├── 🗂️ data/
│   ├── mock-api.js
│   ├── seed-data.js
│   └── constants.js
├── 🔧 config/
│   ├── app-config.js
│   ├── permissions-config.js
│   └── routes-config.js
├── 📱 views/
│   ├── partials/
│   │   ├── header.html
│   │   ├── sidebar.html
│   │   ├── navigation.html
│   │   └── footer.html
│   ├── auth/
│   │   ├── login.html
│   │   └── register.html
│   ├── dashboard/
│   │   ├── admin.html
│   │   ├── auditor.html
│   │   ├── guide.html
│   │   └── user.html
│   ├── admin/
│   │   ├── users.html
│   │   ├── roles.html
│   │   └── analytics.html
│   ├── destinations/
│   │   ├── list.html
│   │   ├── create.html
│   │   ├── edit.html
│   │   └── view.html
│   ├── guides/
│   │   ├── list.html
│   │   ├── verification.html
│   │   └── profile.html
│   └── bookings/
│       ├── list.html
│       ├── create.html
│       └── manage.html
├── 🎯 public/
│   ├── images/
│   │   ├── icons/
│   │   └── destinations/
│   ├── fonts/
│   └── favicon/
├── 📋 package.json
├── 🛠️ vite.config.js (or webpack.config.js)
├── 📖 README.md
└── 🚀 deploy/
    ├── nginx.conf
    └── docker-compose.yml
```

## 🎨 **Key Files & Their Purposes**

### **Core Configuration Files**
```javascript
// config/app-config.js
const APP_CONFIG = {
    ROLES: {
        ADMIN: 'admin',
        AUDITOR: 'auditor', 
        GUIDE: 'guide',
        USER: 'user'
    },
    CONTENT_STATUS: {
        DRAFT: 'draft',
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected'
    },
    API_BASE_URL: 'http://localhost:3000/api'
};

// config/permissions-config.js
const PERMISSIONS = {
    ADMIN: ['*'], // Wildcard for all permissions
    AUDITOR: [
        'view_destinations', 'create_destinations', 'edit_destinations',
        'publish_destinations', 'review_content', 'approve_content',
        'view_users', 'ban_users', 'verify_guides', 'view_analytics'
    ],
    GUIDE: [
        'view_destinations', 'create_destinations', 'edit_own_destinations',
        'view_own_bookings', 'manage_own_profile'
    ],
    USER: [
        'view_destinations', 'create_bookings', 'view_own_bookings',
        'manage_own_profile'
    ]
};
```

### **Authentication & RBAC Core**
```javascript
// js/middleware/auth-middleware.js
class AuthMiddleware {
    static requireAuth(to, from, next) {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = '/auth/login.html';
            return;
        }
        next();
    }
    
    static requireRole(requiredRole) {
        return (to, from, next) => {
            const user = JSON.parse(localStorage.getItem('current_user'));
            if (!user || user.role !== requiredRole) {
                window.location.href = '/errors/403.html';
                return;
            }
            next();
        };
    }
}

// js/middleware/permission-middleware.js
class PermissionMiddleware {
    static hasPermission(requiredPermission) {
        return (to, from, next) => {
            const user = JSON.parse(localStorage.getItem('current_user'));
            const userPermissions = PERMISSIONS[user.role] || [];
            
            if (userPermissions.includes('*') || userPermissions.includes(requiredPermission)) {
                next();
            } else {
                window.location.href = '/errors/403.html';
            }
        };
    }
}
```

### **Service Layer**
```javascript
// js/services/auth-service.js
class AuthService {
    static async login(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('current_user', JSON.stringify(data.user));
            return data;
        }
        throw new Error('Login failed');
    }
    
    static logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        window.location.href = '/auth/login.html';
    }
}

// js/services/user-service.js
class UserService {
    static async createUser(userData) {
        // Admin creates auditors/guides
        const token = localStorage.getItem('auth_token');
        return await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
    }
    
    static async verifyGuide(guideId) {
        // Auditor/Admin verifies guides
        const token = localStorage.getItem('auth_token');
        return await fetch(`/api/guides/${guideId}/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
}
```

### **Mock Data for Development**
```javascript
// data/mock-api.js
const MOCK_DATA = {
    users: [
        {
            id: 1,
            name: 'Admin User',
            email: 'admin@jumuiya.com',
            role: 'admin',
            created_at: '2024-01-01'
        },
        {
            id: 2,
            name: 'Content Auditor',
            email: 'auditor@jumuiya.com', 
            role: 'auditor',
            created_at: '2024-01-02'
        }
    ],
    
    destinations: [
        {
            id: 1,
            name: 'Maasai Mara National Reserve',
            description: 'Famous for wildlife and annual migration',
            status: 'approved',
            created_by: 3,
            approved_by: 2,
            created_at: '2024-01-15'
        }
    ],
    
    permissions: PERMISSIONS
};
```

## 🚀 **Recommended Tech Stack**

### **Frontend Framework Options:**
1. **Vanilla JS + TailwindCSS** (Recommended for learning)
2. **React + TailwindCSS** (For more complex state management)
3. **Vue.js + TailwindCSS** (Progressive framework)

### **Build Tools:**
- **Vite** (Fast development server)
- **TailwindCSS** (Utility-first CSS)
- **Axios** (HTTP client)
- **Chart.js** (For analytics dashboards)

## 📱 **Key Page Components**

### **Role-Based Dashboards:**
- **Admin Dashboard**: User management, system analytics, role management
- **Auditor Dashboard**: Content moderation, guide verification, reports
- **Guide Dashboard**: Destination management, booking view, profile
- **User Dashboard**: Book tours, view destinations, booking history

### **Core Features:**
- **User Registration** (Self-register as user only)
- **Admin User Creation** (Create auditors/guides with generated credentials)
- **Content Workflow** (Draft → Pending → Approved/Rejected)
- **Guide Verification** (Unverified → Pending → Verified → Suspended)
- **Booking System** (Role-based access to bookings)

## 🔐 **Security Implementation**

```javascript
// js/app/store.js - Central state management
class AppStore {
    constructor() {
        this.state = {
            user: JSON.parse(localStorage.getItem('current_user')) || null,
            permissions: [],
            destinations: [],
            bookings: []
        };
    }
    
    hasPermission(permission) {
        return this.state.permissions.includes('*') || 
               this.state.permissions.includes(permission);
    }
    
    isRole(role) {
        return this.state.user?.role === role;
    }
}
```

## 🎯 **Next Steps to Start:**

1. **Set up basic HTML structure** with TailwindCSS
2. **Implement authentication flow** (login/logout)
3. **Create role-based navigation**
4. **Build admin user management interface**
5. **Implement permission middleware**
6. **Add content workflow system**

This structure gives you a **solid foundation** for building the tourism RBAC platform. Want me to start with any specific part? Like the authentication system or admin dashboard? 🚀
