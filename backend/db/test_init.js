const { query } = require('./index');
const fs = require('fs');
const path = require('path');

async function testSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'init.sql')).toString();
  try {
    await query(sql);
    console.log('Database schema created successfully.');
  } catch (err) {
    console.error('Error creating database schema:', err);
  }
}

testSchema();
