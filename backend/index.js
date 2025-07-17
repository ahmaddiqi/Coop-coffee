require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration to allow frontend connections
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5174', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const auditLogger = require('./middleware/audit');
app.use(auditLogger);

const usersRoutes = require('./routes/users');
const koperasiRoutes = require('./routes/koperasi');
const petaniRoutes = require('./routes/petani');
const lahanRoutes = require('./routes/lahan');
const aktivitasRoutes = require('./routes/aktivitas');
const inventoryRoutes = require('./routes/inventory');
const transaksiInventoryRoutes = require('./routes/transaksi_inventory');
const reportsRoutes = require('./routes/reports');
const pasarmikroRoutes = require('./routes/pasarmikro');
const qualityRoutes = require('./routes/quality');

app.use('/api/users', usersRoutes);
app.use('/api/koperasi', koperasiRoutes);
app.use('/api/petani', petaniRoutes);
app.use('/api/lahan', lahanRoutes);
app.use('/api/aktivitas', aktivitasRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transaksi-inventory', transaksiInventoryRoutes);
app.use('/api/reports', reportsRoutes);

app.use('/api/pasarmikro', pasarmikroRoutes);
app.use('/api/quality', qualityRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Coffee Cooperative Management System API');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} and accessible from external networks`);
});

module.exports = app;