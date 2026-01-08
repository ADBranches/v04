// config/database.js
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Detect if we're running tests
const isTest = process.env.NODE_ENV === 'test'; // ✅ Added: detect Jest/test mode

// Database configuration with connection pooling
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'jumuiya_tours',
  user: process.env.DB_USER || 'trovas',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500,
});

// Log connection events
if (!isTest) { // ✅ Added: silence logs during tests
  pool.on('connect', () => console.log('✅ Database connection established'));
  pool.on('acquire', () => console.log('🔗 Client acquired from pool'));
  pool.on('remove', () => console.log('🔌 Client removed from pool'));
  pool.on('error', (err) => console.error('❌ Database connection error:', err));
}

// Enhanced query function with logging and error handling
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log only outside tests
    if (!isTest) { // ✅ Added: disable query logs in test environment
      if (duration > 1000) {
        console.warn(`🐌 Slow query detected: ${text} - ${duration}ms`);
      } else {
        console.log(`📊 Executed query: ${text} - ${duration}ms - Rows: ${result.rows.length}`);
      }
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    if (!isTest) { // ✅ Added: suppress error logs during Jest runs
      console.error('❌ Query error:', {
        text,
        params,
        duration: `${duration}ms`,
        error: error.message,
        code: error.code,
      });
    }

    // Enhance error message for common issues
    if (error.code === '28P01') {
      throw new Error('Database authentication failed - check your credentials');
    } else if (error.code === '3D000') {
      throw new Error('Database does not exist - run setup script first');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to database - make sure PostgreSQL is running');
    }

    throw error;
  }
};

// Transaction helper function
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check function
export const checkDatabaseHealth = async () => {
  try {
    const result = await query('SELECT NOW() as time, version() as version');
    return {
      status: 'healthy',
      timestamp: result.rows[0].time,
      version: result.rows[0].version,
      connection: 'established',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connection: 'failed',
    };
  }
};

// Get database statistics
export const getDatabaseStats = async () => {
  try {
    const tablesResult = await query(`
      SELECT schemaname, tablename, tableowner, tablespace, hasindexes, hasrules, hastriggers
      FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);

    const sizeResult = await query(`
      SELECT pg_size_pretty(pg_database_size($1)) as database_size
    `, [process.env.DB_NAME]);

    const connectionsResult = await query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity WHERE datname = $1
    `, [process.env.DB_NAME]);

    return {
      tables: tablesResult.rows,
      size: sizeResult.rows[0].database_size,
      connections: connectionsResult.rows[0],
    };
  } catch (error) {
    if (!isTest) console.error('Error getting database stats:', error); // ✅ Skip noisy logs in tests
    return { error: error.message };
  }
};

// ✅ Added: clean shutdown helper for Jest teardown
export const closePool = async () => {
  try {
    await pool.end();
    if (!isTest) console.log('🧹 Database pool closed');
  } catch (err) {
    if (!isTest) console.error('Error closing pool:', err);
  }
};

export default pool;
