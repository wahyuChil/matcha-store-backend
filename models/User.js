const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async findByEmail(email) {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, name, email, phone, address, city, province, postal_code, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, email, password, phone }) {
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, hashed, phone || null]
    );
    return rows[0];
  },

  async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  },

  async updateProfile(id, { name, phone, address, city, province, postal_code }) {
    const { rows } = await db.query(
      `UPDATE users SET name=$1, phone=$2, address=$3, city=$4, province=$5, postal_code=$6, updated_at=NOW()
       WHERE id=$7 RETURNING id, name, email, phone, address, city, province, postal_code`,
      [name, phone, address, city, province, postal_code, id]
    );
    return rows[0];
  }
};

module.exports = User;
