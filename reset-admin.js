require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function reset() {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query("UPDATE users SET password = $1 WHERE email = 'admin@matchastore.id'", [hash]);
  console.log('✅ Password admin berhasil direset ke: admin123');
  pool.end();
}
reset();