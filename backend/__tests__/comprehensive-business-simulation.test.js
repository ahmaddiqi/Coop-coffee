const axios = require('axios');
const { expect } = require('chai');

const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to generate a random string
const generateRandomString = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

let adminToken = '';
let adminUserId = '';
let koperasiId = '';
let petaniId = '';
let lahanId = '';
let aktivitasId = '';
let inventoryId = '';

describe('Comprehensive Business Process Simulation', () => {
  before(async () => {
    // Ensure backend is running
    try {
      await axios.get(API_BASE_URL);
      console.log('Backend is reachable.');
    } catch (error) {
      console.error('Backend is not reachable. Please ensure it is running on port 3000.');
      process.exit(1);
    }
  });

  it('should register an initial ADMIN user', async () => {
    const username = `admin_${generateRandomString(5)}`;
    const email = `${username}@example.com`;
    const password = 'password123';

    try {
      const res = await axios.post(`${API_BASE_URL}/users/register`, {
        username,
        password,
        nama_lengkap: 'Initial Admin',
        email,
      });
      expect(res.status).to.equal(201);
      expect(res.data).to.have.property('message', 'Initial admin user registered successfully');
      adminUserId = res.data.user_id;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.warn('Initial admin user already exists. Proceeding with login.');
        // Attempt to login if registration is closed
        const loginRes = await axios.post(`${API_BASE_URL}/users/login`, {
          username: 'admin', // Assuming a default admin user if registration is closed
          password: 'password123',
        });
        expect(loginRes.status).to.equal(200);
        adminToken = loginRes.data.token;
        adminUserId = loginRes.data.user_id;
        console.log('Logged in as existing admin.');
      } else {
        throw error;
      }
    }
  });

  it('should login the ADMIN user', async () => {
    const res = await axios.post(`${API_BASE_URL}/users/login`, {
      username: 'admin', // Use the username from the register step or a known admin
      password: 'password123',
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('token');
    adminToken = res.data.token;
    adminUserId = res.data.user_id; // Ensure adminUserId is set from login
  });

  it('should create a Koperasi', async () => {
    const res = await axios.post(`${API_BASE_URL}/koperasi`, {
      nama_koperasi: `Koperasi Kopi ${generateRandomString(5)}`,
      alamat: 'Jl. Kopi No. 1',
      provinsi: 'Jawa Barat',
      kabupaten: 'Bandung',
      kontak_person: 'Budi',
      nomor_telepon: '08123456789',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Koperasi created successfully');
    koperasiId = res.data.koperasi_id;
  });

  it('should create a Petani', async () => {
    const res = await axios.post(`${API_BASE_URL}/petani`, {
      koperasi_id: koperasiId,
      nama: `Petani ${generateRandomString(5)}`,
      kontak: '08123456780',
      alamat: 'Desa Kopi',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Petani created successfully');
    petaniId = res.data.petani_id;
  });

  it('should create a Lahan', async () => {
    const res = await axios.post(`${API_BASE_URL}/lahan`, {
      koperasi_id: koperasiId,
      petani_id: petaniId,
      nama_lahan: `Lahan ${generateRandomString(5)}`,
      lokasi: 'Bukit Kopi',
      luas_hektar: 1.5,
      estimasi_jumlah_pohon: 1000,
      jenis_kopi_dominan: 'Arabika',
      status_lahan: 'Baru Ditanam',
      estimasi_panen_pertama: '2026-01-01',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Lahan created successfully');
    lahanId = res.data.lahan_id;
  });

  it('should record a TANAM activity', async () => {
    const res = await axios.post(`${API_BASE_URL}/aktivitas`, {
      lahan_id: lahanId,
      jenis_aktivitas: 'TANAM',
      tanggal_aktivitas: '2025-01-15',
      jenis_bibit: 'Arabika Typica',
      status: 'SELESAI',
      keterangan: 'Penanaman bibit baru',
      created_from: 'MANUAL',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Activity created successfully');
    aktivitasId = res.data.aktivitas_id;
  });

  it('should record an ESTIMASI_PANEN activity', async () => {
    const res = await axios.post(`${API_BASE_URL}/aktivitas`, {
      lahan_id: lahanId,
      jenis_aktivitas: 'ESTIMASI_PANEN',
      tanggal_aktivitas: '2025-10-01',
      tanggal_estimasi: '2025-12-15',
      jumlah_estimasi_kg: 500,
      status: 'TERJADWAL',
      keterangan: 'Estimasi panen pertama',
      created_from: 'MANUAL',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Activity created successfully');
  });

  it('should record a PANEN activity', async () => {
    const res = await axios.post(`${API_BASE_URL}/aktivitas`, {
      lahan_id: lahanId,
      jenis_aktivitas: 'PANEN',
      tanggal_aktivitas: '2025-12-20',
      jumlah_aktual_kg: 480,
      status: 'SELESAI',
      keterangan: 'Panen raya',
      created_from: 'MANUAL',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Activity created successfully');
  });

  it('should add inventory (MASUK) for harvested coffee', async () => {
    const res = await axios.post(`${API_BASE_URL}/inventory`, {
      koperasi_id: koperasiId,
      nama_item: 'Kopi Cherry',
      tipe_transaksi: 'MASUK',
      tanggal: '2025-12-20',
      jumlah: 480,
      satuan: 'KG',
      batch_id: `BATCH-CHERRY-${generateRandomString(5)}`,
      keterangan: 'Hasil panen dari lahan',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Inventory record created successfully');
    inventoryId = res.data.inventory_id;
  });

  it('should record a Transaksi_Inventory (PANEN)', async () => {
    const res = await axios.post(`${API_BASE_URL}/transaksi_inventory`, {
      inventory_id: inventoryId,
      koperasi_id: koperasiId,
      tipe_transaksi: 'MASUK',
      jenis_operasi: 'PANEN',
      tanggal: '2025-12-20',
      jumlah: 480,
      petani_id: petaniId,
      lahan_id: lahanId,
      keterangan: 'Pencatatan hasil panen',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Transaction created successfully');
  });

  it('should record a Transaksi_Inventory (PROSES) for green bean conversion', async () => {
    const res = await axios.post(`${API_BASE_URL}/transaksi_inventory`, {
      inventory_id: inventoryId, // Reference the cherry batch
      koperasi_id: koperasiId,
      tipe_transaksi: 'PROSES',
      jenis_operasi: 'TRANSFORMASI',
      tanggal: '2026-01-05',
      jumlah: 100, // Assuming 100kg green bean from 480kg cherry
      keterangan: 'Proses dari cherry menjadi green bean',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Transaction created successfully');
  });

  it('should add inventory (MASUK) for green bean', async () => {
    const res = await axios.post(`${API_BASE_URL}/inventory`, {
      koperasi_id: koperasiId,
      nama_item: 'Kopi Green Bean',
      tipe_transaksi: 'MASUK',
      tanggal: '2026-01-05',
      jumlah: 100,
      satuan: 'KG',
      batch_id: `BATCH-GREENBEAN-${generateRandomString(5)}`,
      parent_batch_id: `BATCH-CHERRY-${generateRandomString(5)}`, // Link to parent cherry batch
      keterangan: 'Hasil proses dari kopi cherry',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Inventory record created successfully');
  });

  it('should record a Transaksi_Inventory (JUAL) for green bean sale', async () => {
    const res = await axios.post(`${API_BASE_URL}/transaksi_inventory`, {
      inventory_id: inventoryId, // Reference the green bean batch
      koperasi_id: koperasiId,
      tipe_transaksi: 'KELUAR',
      jenis_operasi: 'PENJUALAN',
      tanggal: '2026-01-10',
      jumlah: 50,
      buyer: 'Pembeli Kopi Internasional',
      harga_total: 5000000,
      keterangan: 'Penjualan green bean',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'Transaction created successfully');
  });

  it('should simulate PasarMikro integration (placeholder)', async () => {
    // This is a placeholder for future integration.
    // In a real scenario, this would involve calling a PasarMikro API.
    const res = await axios.post(`${API_BASE_URL}/pasarmikro/simulate`, {
      data: 'Simulated data for PasarMikro',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('message', 'PasarMikro integration simulated successfully');
  });

  it('should retrieve national reports as SUPER_ADMIN', async () => {
    // First, create a SUPER_ADMIN user if not already done
    let superAdminToken = adminToken; // Assuming current admin can be SUPER_ADMIN for testing
    try {
      const res = await axios.post(`${API_BASE_URL}/users`, {
        username: `superadmin_${generateRandomString(5)}`,
        password: 'superadminpassword',
        nama_lengkap: 'Super Admin User',
        email: `superadmin_${generateRandomString(5)}@example.com`,
        role: 'SUPER_ADMIN',
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).to.equal(201);
      const loginRes = await axios.post(`${API_BASE_URL}/users/login`, {
        username: res.data.username,
        password: 'superadminpassword',
      });
      superAdminToken = loginRes.data.token;
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.message === 'Username already exists') {
        console.warn('SUPER_ADMIN user already exists. Attempting to login as SUPER_ADMIN.');
        const loginRes = await axios.post(`${API_BASE_URL}/users/login`, {
          username: 'superadmin', // Assuming a default superadmin user
          password: 'superadminpassword',
        });
        expect(loginRes.status).to.equal(200);
        superAdminToken = loginRes.data.token;
      } else {
        throw error;
      }
    }

    const res = await axios.get(`${API_BASE_URL}/reports/national`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('totalHarvestPerProvince');
    expect(res.data).to.have.property('activeFarmersPerProvince');
    expect(res.data).to.have.property('totalLandAreaPerProvince');
  });

  it('should retrieve national supply projection as SUPER_ADMIN', async () => {
    const res = await axios.get(`${API_BASE_URL}/reports/national/supply-projection`, {
      headers: { Authorization: `Bearer ${adminToken}` }, // Assuming adminToken is SUPER_ADMIN or can access
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('supplyProjection');
  });

  it('should retrieve koperasi list as SUPER_ADMIN', async () => {
    const res = await axios.get(`${API_BASE_URL}/reports/national/koperasi-list`, {
      headers: { Authorization: `Bearer ${adminToken}` }, // Assuming adminToken is SUPER_ADMIN or can access
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('koperasiList');
    expect(res.data.koperasiList).to.be.an('array').that.is.not.empty;
  });

  it('should retrieve specific koperasi performance as SUPER_ADMIN', async () => {
    const res = await axios.get(`${API_BASE_URL}/reports/national/koperasi-performance/${koperasiId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }, // Assuming adminToken is SUPER_ADMIN or can access
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('koperasi_id', koperasiId);
    expect(res.data).to.have.property('totalHarvest');
    expect(res.data).to.have.property('activeFarmers');
    expect(res.data).to.have.property('totalLandArea');
  });

  // Add more tests for user management by SUPER_ADMIN
  it('SUPER_ADMIN should create a new user', async () => {
    const username = `newuser_${generateRandomString(5)}`;
    const email = `${username}@example.com`;
    const password = 'newuserpassword';

    const res = await axios.post(`${API_BASE_URL}/users`, {
      username,
      password,
      nama_lengkap: 'New Test User',
      email,
      role: 'OPERATOR',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }, // Assuming adminToken is SUPER_ADMIN
    });
    expect(res.status).to.equal(201);
    expect(res.data).to.have.property('message', 'User created successfully');
  });

  it('SUPER_ADMIN should get all users', async () => {
    const res = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }, // Assuming adminToken is SUPER_ADMIN
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.be.an('array').that.is.not.empty;
  });

  it(`SUPER_ADMIN should reset a user's password`, async () => {
    // Create a user to reset password for
    const username = `resetuser_${generateRandomString(5)}`;
    const email = `${username}@example.com`;
    const password = 'oldpassword';
    const newUserRes = await axios.post(`${API_BASE_URL}/users`, {
      username,
      password,
      nama_lengkap: 'Reset Test User',
      email,
      role: 'OPERATOR',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userIdToReset = newUserRes.data.user_id;

    const res = await axios.put(`${API_BASE_URL}/users/${userIdToReset}/reset-password`, {
      new_password: 'newpassword123',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }, // Assuming adminToken is SUPER_ADMIN
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('message', 'Password reset successfully');
  });

  it('SUPER_ADMIN should deactivate a user', async () => {
    // Create a user to deactivate
    const username = `deactuser_${generateRandomString(5)}`;
    const email = `${username}@example.com`;
    const password = 'password';
    const newUserRes = await axios.post(`${API_BASE_URL}/users`, {
      username,
      password,
      nama_lengkap: 'Deactivate Test User',
      email,
      role: 'OPERATOR',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userIdToDeactivate = newUserRes.data.user_id;

    const res = await axios.put(`${API_BASE_URL}/users/${userIdToDeactivate}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }, // Assuming adminToken is SUPER_ADMIN
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('message', 'User deactivated successfully');
  });

  it('SUPER_ADMIN should activate a user', async () => {
    // Create and deactivate a user first
    const username = `actuser_${generateRandomString(5)}`;
    const email = `${username}@example.com`;
    const password = 'password';
    const newUserRes = await axios.post(`${API_BASE_URL}/users`, {
      username,
      password,
      nama_lengkap: 'Activate Test User',
      email,
      role: 'OPERATOR',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userIdToActivate = newUserRes.data.user_id;
    await axios.put(`${API_BASE_URL}/users/${userIdToActivate}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const res = await axios.put(`${API_BASE_URL}/users/${userIdToActivate}/activate`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }, // Assuming adminToken is SUPER_ADMIN
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('message', 'User activated successfully');
  });

  it(`SUPER_ADMIN should change a user's role`, async () => {
    // Create a user to change role for
    const username = `roleuser_${generateRandomString(5)}`;
    const email = `${username}@example.com`;
    const password = 'password';
    const newUserRes = await axios.post(`${API_BASE_URL}/users`, {
      username,
      password,
      nama_lengkap: 'Role Test User',
      email,
      role: 'OPERATOR',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userIdToChangeRole = newUserRes.data.user_id;

    const res = await axios.put(`${API_BASE_URL}/users/${userIdToChangeRole}/role`, {
      role: 'ADMIN',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }, // Assuming adminToken is SUPER_ADMIN
    });
    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('message', 'User role updated successfully');
  });
});
