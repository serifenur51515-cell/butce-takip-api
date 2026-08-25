import request from 'supertest';
import app from './index.js';

describe('API Güvenlik ve Kimlik Doğrulama Testleri', () => {

  // Test 1: Token olmadan korumalı rotaya istek atılırsa 401 dönmeli
  it('Token olmadan /transactions isteği 401 dönmeli', async () => {
    const res = await request(app).get('/transactions');
    expect(res.statusCode).toEqual(401);
  });

  // Test 2: Yanlış şifre ile giriş engellenmeli
  it('Yanlış şifre ile giriş engellenmeli', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'yanlis@kullanici.com', password: 'hatalisifre' });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

});