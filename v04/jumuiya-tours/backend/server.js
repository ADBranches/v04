// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


if (process.env.NODE_ENV !== 'production') {
  console.log('⚙️ Rate limiting disabled in development mode.');
}

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

/* ───────────────────────  ROUTE IMPORTS  ─────────────────────── */
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import destinationRoutes from './routes/destinations.js';
import guideRoutes from './routes/guides.js';
import bookingRoutes from './routes/bookings.js';
import moderationRoutes from './routes/moderation.js';
import adminRoutes from './routes/admin.js';

/* ───────────────────────  SECURITY / CORS  ─────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/* ───────────────────────  RATE LIMITING  ─────────────────────── */

if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth/', authLimiter);

const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // 100 write actions/minute
  message: { error: 'Write limit exceeded. Please slow down.' }
});
app.use(['/api/bookings', '/api/admin', '/api/moderation'], writeLimiter);

/* ───────────────────────  BODY & STATIC  ─────────────────────── */
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 100 }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

/* ───────────────────────  LOGGING  ─────────────────────── */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  next();
});

/* ───────────────────────  ROUTES  ─────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', adminRoutes);

/* ───────────────────────  HEALTH & STATUS  ─────────────────────── */
app.get('/api/health', async (req, res) => {
  try {
    const { query } = await import('./config/database.js');
    const dbResult = await query('SELECT NOW() as current_time, version() as version');
    res.json({
      status: 'OK',
      message: 'Jumuiya Tours API is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        status: 'connected',
        time: dbResult.rows[0].current_time,
        version: dbResult.rows[0].version.split(' ')[1]
      },
      system: {
        node: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Service unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: { status: 'disconnected' }
    });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'Jumuiya Tours API',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/* ───────────────────────  DEFAULT / 404 / ERROR  ─────────────────────── */
app.get('/', (req, res) => {
  res.json({
    message: '🏔️ Welcome to Jumuiya Tours Backend API',
    version: '1.0.0',
    docs: 'https://github.com/jumuiya-tours/api-docs'
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    suggestion: 'Visit /api for available endpoints'
  });
});

app.use((error, req, res, next) => {
  console.error('🚨 Global Error Handler:', error);
  const status = error.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    code: 'INTERNAL_ERROR'
  });
});

/* ───────────────────────  CONDITIONAL SERVER START  ─────────────────────── */
// ✅ Prevent Jest (NODE_ENV=test) from rebinding the same port
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🎉 Jumuiya Tours API Server Started!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Local: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/api/health
🕒 Started at: ${new Date().toISOString()}
    `);
  });
}

/* ───────────────────────  SHUTDOWN SAFETY  ─────────────────────── */
const gracefulShutdown = async () => {
  console.log('🧹 Shutting down gracefully...');
  try {
    const poolModule = await import('./config/database.js');
    if (poolModule.default?.end) await poolModule.default.end();
    if (server) server.close(() => process.exit(0));
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', err => { console.error('💥 Uncaught Exception:', err); process.exit(1); });
process.on('unhandledRejection', reason => { console.error('💥 Unhandled Rejection:', reason); process.exit(1); });

export default app;
