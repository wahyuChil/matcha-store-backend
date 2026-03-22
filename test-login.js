require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = 'admin@matchastore.id'");
  if (!rows[0]) {
    console.log('❌ User admin tidak ditemukan di database!');
    console.log('→ Jalankan schema.sql dulu di Supabase');
  } else {
    console.log('✅ User ditemukan:', rows[0].email, '| Role:', rows[0].role);
    const valid = await bcrypt.compare('admin123', rows[0].password);
    console.log('Password admin123 cocok?', valid ? '✅ YA' : '❌ TIDAK');
  }
  pool.end();
}
test();