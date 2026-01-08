#!/usr/bin/env bash

# Navigate to backend directory and create package.json
cd /home/trovas/Downloads/jumuiya_tours/v03/v04/jumuiya-tours/backend

# Create package.json
cat > package.json << 'EOF'
{
  "name": "jumuiya-tours-backend",
  "version": "1.0.0",
  "description": "Backend API for Jumuiya Tours",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "db:setup": "node database/setup.js",
    "db:seed": "node database/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.1.4",
    "express-rate-limit": "^6.7.0",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# Create .env file
cat > .env << 'EOF'
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jumuiya_tours
DB_USER=trovas
DB_PASSWORD=
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_in_production_12345
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@jumuiya.com
ADMIN_PASSWORD=Admin123!
EOF

# Create server.js
cat > server.js << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import destinationRoutes from './routes/destinations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/destinations', destinationRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Jumuiya Tours API is running!',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Jumuiya Tours API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
EOF

# Create database directory and setup script
mkdir -p database config routes middleware controllers models

cat > config/database.js << 'EOF'
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

export const query = (text, params) => pool.query(text, params);

export default pool;
EOF

cat > database/setup.js << 'EOF'
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres'
});

async function setupDatabase() {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        // Check if database exists
        const dbCheck = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [process.env.DB_NAME]
        );

        if (dbCheck.rows.length === 0) {
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log(`Database ${process.env.DB_NAME} created successfully`);
        } else {
            console.log(`Database ${process.env.DB_NAME} already exists`);
        }

        await client.end();

        // Connect to our database to create tables
        const dbClient = new Client({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        await dbClient.connect();

        // Create tables
        await dbClient.query(`
            CREATE TABLE IF NOT EXISTS users (
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

            CREATE TABLE IF NOT EXISTS destinations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                location VARCHAR(255),
                price_range VARCHAR(50),
                images JSONB,
                status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
                created_by INTEGER NOT NULL REFERENCES users(id),
                approved_by INTEGER REFERENCES users(id),
                submitted_at TIMESTAMP,
                approved_at TIMESTAMP,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS bookings (
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

            CREATE TABLE IF NOT EXISTS moderation_logs (
                id SERIAL PRIMARY KEY,
                content_type VARCHAR(50) NOT NULL,
                content_id INTEGER NOT NULL,
                action VARCHAR(50) NOT NULL,
                moderator_id INTEGER NOT NULL REFERENCES users(id),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
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
        `);

        console.log('All tables created/verified successfully');

        // Create admin user if not exists
        const adminCheck = await dbClient.query(
            'SELECT id FROM users WHERE email = $1',
            [process.env.ADMIN_EMAIL]
        );

        if (adminCheck.rows.length === 0) {
            const bcrypt = await import('bcryptjs');
            const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
            
            await dbClient.query(
                `INSERT INTO users (email, password_hash, name, role) 
                 VALUES ($1, $2, $3, 'admin')`,
                [process.env.ADMIN_EMAIL, passwordHash, 'System Administrator']
            );
            console.log('Admin user created successfully');
        }

        await dbClient.end();
        console.log('Database setup completed!');

    } catch (error) {
        console.error('Database setup error:', error);
    }
}

setupDatabase();
EOF

cat > middleware/auth.js << 'EOF'
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await query(
            'SELECT id, email, name, role, guide_status, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};
EOF

cat > routes/auth.js << 'EOF'
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await query(
            `INSERT INTO users (email, password_hash, name, role) 
             VALUES ($1, $2, $3, 'user') 
             RETURNING id, email, name, role, created_at`,
            [email, passwordHash, name]
        );

        const user = result.rows[0];

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const result = await query(
            'SELECT id, email, password_hash, name, role, guide_status, is_active FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                guide_status: user.guide_status
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    res.json({
        user: req.user
    });
});

export default router;
EOF

cat > routes/users.js << 'EOF'
import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin/Auditor only)
router.get('/', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, name, role, guide_status, is_active, created_at 
             FROM users 
             ORDER BY created_at DESC`
        );

        res.json({ users: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create user (Admin only - for creating auditors/guides)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!['auditor', 'guide'].includes(role)) {
            return res.status(400).json({ error: 'Role must be auditor or guide' });
        }

        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await query(
            `INSERT INTO users (email, password_hash, name, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, email, name, role, created_at`,
            [email, passwordHash, name, role]
        );

        const user = result.rows[0];

        res.status(201).json({
            message: 'User created successfully',
            user: user,
            temporary_password: password
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Apply as guide (User only)
router.post('/apply-guide', authenticateToken, requireRole(['user']), async (req, res) => {
    try {
        const userId = req.user.id;

        await query(
            `UPDATE users 
             SET guide_status = 'pending', verification_submitted_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [userId]
        );

        res.json({ message: 'Guide application submitted successfully' });

    } catch (error) {
        console.error('Guide application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
EOF

cat > routes/destinations.js << 'EOF'
import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all destinations (public)
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT d.*, u.name as creator_name 
             FROM destinations d 
             LEFT JOIN users u ON d.created_by = u.id 
             WHERE d.status = 'approved'
             ORDER BY d.created_at DESC`
        );

        res.json({ destinations: result.rows });
    } catch (error) {
        console.error('Get destinations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create destination (Authenticated users)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, location, price_range } = req.body;
        const userId = req.user.id;

        if (!name || !description || !location) {
            return res.status(400).json({ error: 'Name, description, and location are required' });
        }

        const result = await query(
            `INSERT INTO destinations (name, description, location, price_range, created_by, status) 
             VALUES ($1, $2, $3, $4, $5, 'draft') 
             RETURNING *`,
            [name, description, location, price_range, userId]
        );

        res.status(201).json({
            message: 'Destination created successfully',
            destination: result.rows[0]
        });

    } catch (error) {
        console.error('Create destination error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
EOF

echo "✅ Backend files created successfully!"
