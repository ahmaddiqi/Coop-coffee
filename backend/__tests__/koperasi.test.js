const request = require('supertest');
const app = require('../index');
const db = require('../db');
const { getAdminToken, clearDatabase } = require('../setup');

describe('Koperasi API', () => {
  let adminToken;
  let testKoperasiId;

  beforeEach(async () => {
    await clearDatabase(); // Clear database before each test
    adminToken = await getAdminToken(); // Get a fresh admin token
  });

  it('should create a new koperasi (ADMIN only)', async () => {
    const res = await request(app)
      .post('/api/koperasi')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_koperasi: 'Koperasi Test 1',
        alamat: 'Jl. Test No. 1',
        provinsi: 'Provinsi Test',
        kabupaten: 'Kabupaten Test',
        kontak_person: 'Contact Test',
        nomor_telepon: '123456789',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('koperasi_id');
    expect(res.body.nama_koperasi).toEqual('Koperasi Test 1');
    testKoperasiId = res.body.koperasi_id;
  });

  it('should get all koperasi', async () => {
    // Create a koperasi first to ensure there's data to retrieve
    await request(app)
      .post('/api/koperasi')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_koperasi: 'Koperasi for Get All',
        alamat: 'Jl. Get All',
        provinsi: 'Provinsi Get All',
        kabupaten: 'Kabupaten Get All',
        kontak_person: 'Contact Get All',
        nomor_telepon: '111222333',
      });

    const res = await request(app)
      .get('/api/koperasi')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a single koperasi by ID', async () => {
    // Create a koperasi first to retrieve
    const createRes = await request(app)
      .post('/api/koperasi')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_koperasi: 'Koperasi for Single Get',
        alamat: 'Jl. Single Get',
        provinsi: 'Provinsi Single Get',
        kabupaten: 'Kabupaten Single Get',
        kontak_person: 'Contact Single Get',
        nomor_telepon: '444555666',
      });
    const koperasiId = createRes.body.koperasi_id;

    const res = await request(app)
      .get(`/api/koperasi/${koperasiId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('koperasi_id', koperasiId);
  });

  it('should update a koperasi (ADMIN only)', async () => {
    // Create a koperasi to update
    const createRes = await request(app)
      .post('/api/koperasi')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_koperasi: 'Koperasi to Update',
        alamat: 'Jl. Update',
        provinsi: 'Provinsi Update',
        kabupaten: 'Kabupaten Update',
        kontak_person: 'Contact Update',
        nomor_telepon: '777888999',
      });
    const koperasiId = createRes.body.koperasi_id;

    const res = await request(app)
      .put(`/api/koperasi/${koperasiId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_koperasi: 'Koperasi Updated',
        alamat: 'Jl. Updated',
        provinsi: 'Provinsi Updated',
        kabupaten: 'Kabupaten Updated',
        kontak_person: 'Contact Updated',
        nomor_telepon: '999888777',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('nama_koperasi', 'Koperasi Updated');
  });

  it('should delete a koperasi (ADMIN only)', async () => {
    // Create a koperasi to delete
    const createRes = await request(app)
      .post('/api/koperasi')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_koperasi: 'Koperasi to Delete',
        alamat: 'Jl. Delete',
        provinsi: 'Provinsi Delete',
        kabupaten: 'Kabupaten Delete',
        kontak_person: 'Contact Delete',
        nomor_telepon: '123123123',
      });
    const koperasiId = createRes.body.koperasi_id;

    const res = await request(app)
      .delete(`/api/koperasi/${koperasiId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Koperasi deleted successfully');

    // Verify it's deleted
    const getRes = await request(app)
      .get(`/api/koperasi/${koperasiId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.statusCode).toEqual(404);
  });
});