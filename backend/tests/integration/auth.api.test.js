import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/db.js';

describe('Auth API Integration Tests', () => {
  const testEmail = `integration-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testFullName = 'Integration Test User';

  const cleanup = async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            startsWith: 'integration-',
          },
        },
      });
    } catch (err) {
      console.error('Error during test cleanup:', err);
    }
  };

  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user successfully with standard response format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          fullName: testFullName,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body.message).toContain('registered successfully');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.fullName).toBe(testFullName);
    });

    test('should fail registration when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('error');
    });

    test('should fail registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: testPassword,
          fullName: testFullName,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('error');
    });

    test('should fail registration with weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `integration-weak-${Date.now()}@example.com`,
          password: '123',
          fullName: testFullName,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('error');
    });

    test('should fail registration on duplicate email', async () => {
      const duplicateEmail = `integration-dup-${Date.now()}@example.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: duplicateEmail,
          password: testPassword,
          fullName: testFullName,
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: duplicateEmail,
          password: testPassword,
          fullName: testFullName,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const loginEmail = `integration-login-${Date.now()}@example.com`;

    beforeAll(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: loginEmail,
          password: testPassword,
          fullName: testFullName,
        });
    });

    test('should authenticate user and return access token on successful login', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: loginEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(loginEmail);
    });

    test('should reject authentication with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: loginEmail,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('error');
    });

    test('should reject authentication with unknown email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'integration-unknown@example.com',
          password: testPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('error');
    });

    test('should reject login if fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: loginEmail,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    const profileEmail = `integration-profile-${Date.now()}@example.com`;
    let userToken = '';

    beforeAll(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: profileEmail,
          password: testPassword,
          fullName: testFullName,
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: profileEmail,
          password: testPassword,
        });
      userToken = loginRes.body?.data?.token || '';
    });

    test('should retrieve profile with valid JWT', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body.data.user.email).toBe(profileEmail);
    });

    test('should block profile retrieval with missing JWT', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('error');
    });

    test('should block profile retrieval with invalid JWT', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtokenhere');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('error');
    });
  });
});
