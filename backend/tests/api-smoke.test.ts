import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  process.env.VERCEL = '1';
  app = (await import('../src/index')).default;
});

describe('HTTP security smoke checks', () => {
  it('exposes a healthy API check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('protects personal finance routes without a session', async () => {
    const response = await request(app).get('/api/transactions');
    expect(response.status).toBe(401);
  });

  it('rejects malformed login input and clears the session on logout', async () => {
    const invalidLogin = await request(app).post('/api/auth/login').send({});
    expect(invalidLogin.status).toBe(400);

    const logout = await request(app).post('/api/auth/logout');
    expect(logout.status).toBe(204);
    expect(logout.headers['set-cookie']?.[0]).toContain('finora_session=');
  });

  it('rejects oversized JSON payloads', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ data: 'x'.repeat(40_000) }));
    expect(response.status).toBe(413);
  });
});
