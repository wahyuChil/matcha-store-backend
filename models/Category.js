const db = require('../config/db');

const Category = {
  async findAll() {
    const { rows } = await db.query(`SELECT * FROM categories ORDER BY name ASC`);
    return rows;
  },
  async findById(id) {
    const { rows } = await db.query(`SELECT * FROM categories WHERE id = $1`, [id]);
    return rows[0] || null;
  }
};

module.exports = Category;
