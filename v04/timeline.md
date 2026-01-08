# 🗓️ Development Timeline & Backend Plan

## 📅 **Project Development Timeline**

### **Phase 1: Foundation & Core Setup (Week 1-2)**
```
Week 1:
✅ Day 1-2: Project setup, architecture, basic frontend
✅ Day 3-4: Backend API structure, database design
✅ Day 5-7: Authentication system, user registration

Week 2:
Day 1-3: RBAC middleware, permission system
Day 4-5: Basic CRUD for destinations
Day 6-7: User dashboard & navigation
```

### **Phase 2: Core Features (Week 3-4)**
```
Week 3:
Day 1-2: Guide verification system
Day 3-4: Content moderation workflow
Day 5-7: Booking system implementation

Week 4:
Day 1-3: Admin dashboard & user management
Day 4-5: Auditor content review interface
Day 6-7: Testing & bug fixes
```

### **Phase 3: Advanced Features (Week 5-6)**
```
Week 5:
Day 1-2: Analytics & reporting
Day 3-4: Notifications system
Day 5-7: Commission management

Week 6:
Day 1-3: Polish UI/UX, animations
Day 4-5: Performance optimization
Day 6-7: Deployment & documentation
```

### **Phase 4: Polish & Launch (Week 7)**
```
Day 1-2: Security audit
Day 3-4: Load testing
Day 5-7: Final deployment & monitoring
```

**Total: 7 weeks to full production readiness**

---

# 🗄️ Backend Architecture Plan

## **Tech Stack**
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (pre-installed on your Kali)
- **Authentication**: JWT + bcrypt
- **File Storage**: Local file system (for images)
- **API**: RESTful with RBAC protection

## **Database Schema Design**

```sql
-- Users table with role-based fields
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'auditor', 'guide', 'user')),
    guide_status VARCHAR(50) DEFAULT 'unverified' CHECK (guide_status IN ('unverified', 'pending', 'verified', 'suspended')),
    verification_submitted_at TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destinations with approval workflow
CREATE TABLE destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    price_range VARCHAR(50),
    images JSONB, -- Array of image URLs
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    created_by INTEGER NOT NULL REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings system
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    destination_id INTEGER NOT NULL REFERENCES destinations(id),
    guide_id INTEGER REFERENCES users(id),
    booking_date DATE NOT NULL,
    number_of_people INTEGER NOT NULL,
    total_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content moderation log
CREATE TABLE moderation_logs (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'destination', 'guide_verification'
    content_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'requested_revision'
    moderator_id INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 👥 **User Responsibilities & Permissions**

## **1. ADMIN (Super User)**
### **Responsibilities:**
- 🎯 **System Management**: Full platform control
- 👥 **User Management**: Create auditors/guides, manage all users
- 🔐 **Role Management**: Assign/modify user roles and permissions
- 📊 **Business Analytics**: View revenue, user statistics, platform metrics
- ⚙️ **System Configuration**: Manage settings, commission rates, policies

### **Key Actions:**
- Create auditor and guide accounts with generated credentials
- Suspend/ban any user account
- Override any content moderation decision
- Access all financial and user data
- Reset passwords for all users

## **2. AUDITOR (Content Manager)**
### **Responsibilities:**
- 📝 **Content Quality Control**: Review and approve guide submissions
- 👨‍💼 **Guide Verification**: Verify guide credentials and documents
- 🛡️ **Compliance**: Ensure content meets platform standards
- 📈 **Content Analytics**: Monitor content performance and engagement
- ⚠️ **Moderation**: Handle user reports and content disputes

### **Key Actions:**
- Approve/reject destination submissions from guides
- Request revisions on submitted content
- Verify guide applications and documents
- Suspend guides for policy violations
- View and manage user-generated content
- Access moderation analytics

## **3. GUIDE (Content Creator)**
### **Responsibilities:**
- 🗺️ **Destination Creation**: Create and manage tour destinations
- 📋 **Content Development**: Write descriptions, upload photos, set prices
- 🎫 **Booking Management**: Handle their own tour bookings
- 👤 **Profile Management**: Maintain professional profile and credentials
- 💬 **Customer Interaction**: Respond to booking inquiries

### **Key Actions:**
- Create and edit destination listings (requires approval)
- Submit destinations for auditor review
- View and manage their own bookings
- Update availability and pricing
- Upload verification documents
- Manage personal profile and portfolio

## **4. USER (Customer/Tourist)**
### **Responsibilities:**
- 🔍 **Destination Discovery**: Browse and search for tours
- 🎫 **Booking Management**: Book tours, manage reservations
- 📝 **Review System**: Leave reviews and ratings
- 👤 **Profile Management**: Personal account management
- 💰 **Payment Processing**: Handle payments for bookings

### **Key Actions:**
- Browse approved destinations
- Book tours with available guides
- View booking history and status
- Cancel their own bookings (within policy)
- Update personal information
- View guide profiles and reviews

---

# 🛣️ **Content Workflow Process**

## **Destination Creation Flow:**
```
GUIDE creates destination → Status: "Draft"
GUIDE submits for review → Status: "Pending" 
AUDITOR reviews content → Either:
    ✅ Approve → Status: "Approved" (public)
    🔄 Request Revisions → Status: "Draft" (with comments)
    ❌ Reject → Status: "Rejected" (with reason)
ADMIN can override any status
```

## **Guide Verification Flow:**
```
USER applies as guide → Status: "Unverified"
GUIDE submits documents → Status: "Pending Verification"
AUDITOR reviews documents → Either:
    ✅ Verify → Status: "Verified" (can create content)
    ❌ Reject → Status: "Unverified" (with reason)
ADMIN can manually verify any guide
```

## **Booking Flow:**
```
USER books destination → Status: "Pending"
GUIDE confirms booking → Status: "Confirmed"
After tour completion → Status: "Completed"
Either party can cancel → Status: "Cancelled" (with policy rules)
```

---

# 🔧 **Backend API Routes Structure**

## **Authentication Routes**
```javascript
POST   /api/auth/register     // User self-registration
POST   /api/auth/login        // All user login
POST   /api/auth/logout       // Logout
POST   /api/auth/refresh      // Refresh token
```

## **User Management Routes**
```javascript
// Admin only
POST   /api/admin/users       // Create auditor/guide accounts
GET    /api/admin/users       // List all users
PUT    /api/admin/users/:id   // Update user role/status
POST   /api/admin/users/:id/reset-password  // Reset credentials

// Auditor access
GET    /api/users             // List users (limited fields)
PUT    /api/users/:id/ban     // Ban user

// Self-management
GET    /api/profile           // Get own profile
PUT    /api/profile           // Update own profile
```

## **Destination Routes**
```javascript
// Public routes
GET    /api/destinations           // List approved destinations
GET    /api/destinations/:id       // View single destination

// Guide routes
POST   /api/destinations           // Create destination (draft)
PUT    /api/destinations/:id       // Edit own destination
POST   /api/destinations/:id/submit  // Submit for approval

// Auditor/Admin routes
GET    /api/destinations/pending   // List pending destinations
POST   /api/destinations/:id/approve    // Approve destination
POST   /api/destinations/:id/reject     // Reject destination
POST   /api/destinations/:id/request-revision  // Request changes
```

## **Guide Management Routes**
```javascript
// Guide application
POST   /api/guides/apply          // User applies as guide

// Auditor/Admin routes
GET    /api/guides/pending        // List pending guide applications
POST   /api/guides/:id/verify     // Verify guide
POST   /api/guides/:id/suspend    // Suspend guide
```

## **Booking Routes**
```javascript
// User routes
POST   /api/bookings              // Create booking
GET    /api/bookings              // List own bookings
PUT    /api/bookings/:id/cancel   // Cancel own booking

// Guide routes  
GET    /api/guide/bookings        // List guide's bookings
PUT    /api/bookings/:id/confirm  // Confirm booking
PUT    /api/bookings/:id/complete // Mark as completed
```

---

# 🚀 **Immediate Next Steps**

## **Today's Focus:**
1. **Set up PostgreSQL database** with above schema
2. **Create basic Express.js backend** with authentication
3. **Connect frontend to backend** for user registration/login
4. **Implement JWT-based RBAC middleware**

## **Database Setup Commands:**
```bash
# Switch to postgres user and create database
sudo -u postgres psql

# In PostgreSQL:
CREATE DATABASE jumuiya_tours;
CREATE USER jumuiya_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE jumuiya_tours TO jumuiya_user;

# Then run the schema creation SQL
```

**Ready to start with the backend setup?** I'll provide the Express.js server structure and database connection next! 🎯
