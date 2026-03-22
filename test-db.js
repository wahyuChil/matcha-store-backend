require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ Koneksi berhasil!');
    return client.end();
  })
  .catch(err => {
    console.log('❌ Gagal:', err.message);
    console.log('URL yang dipakai:', process.env.DATABASE_URL);
  });