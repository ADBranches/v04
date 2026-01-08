import request from 'supertest';
import app from '../server.js'; // ensure server.js exports your Express app

describe('Jumuiya API E2E', () => {
  const base = request(app);
  let adminToken = process.env.ADMIN_TOKEN || '';

  it('health', async () => {
    const res = await base.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('login admin (fallback when no env token)', async () => {
    if (!adminToken) {
      const res = await base
        .post('/api/auth/login')
        .send({ email: 'admin@jumuiya.com', password: 'admin123' }); // ✅ removed trailing dot
      expect(res.status).toBe(200);
      adminToken = res.body.token;
    }
    expect(adminToken).toBeTruthy();
  });

  it('who am i', async () => {
    const res = await base
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user?.role).toBe('admin');
  });

  it('destinations public list', async () => {
    const res = await base.get('/api/destinations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.destinations)).toBe(true);
  });

  it('admin creates destination', async () => {
    const res = await base
      .post('/api/destinations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Jest Destination',
        description: 'Created during automated e2e test',
        location: 'Uganda',
      });
    // backend correctly returns 201
    expect([200, 201]).toContain(res.status);
    expect(res.body.destination?.id).toBeTruthy();
  });

  it('user forbidden on admin users list', async () => {
    const userToken = process.env.USER_TOKEN || '';
    if (!userToken) {
      console.warn('⚠️ USER_TOKEN missing in environment');
    }
    const res = await base
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect([401, 403]).toContain(res.status);
  });

  afterAll(async () => {
    // ✅ Graceful teardown to silence "Cannot log after tests are done"
    try {
      // Close Prisma if it was ever used (kept for safety)
      const { prisma } = await import('../middleware/audit.js');
      if (prisma) await prisma.$disconnect();
    } catch {}

    try {
      // ✅ NEW: Close the PostgreSQL pool gracefully
      const { closePool } = await import('../config/database.js');
      if (closePool) await closePool();
    } catch (err) {
      console.warn('⚠️ Database pool close skipped:', err.message);
    }
  });

});
