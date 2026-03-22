const db = require('../config/db');

const Product = {
  async findAll({ categorySlug, featured, search, limit = 20, offset = 0 } = {}) {
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    const params = [];
    let idx = 1;

    if (categorySlug) {
      query += ` AND c.slug = $${idx++}`;
      params.push(categorySlug);
    }
    if (featured) {
      query += ` AND p.is_featured = true`;
    }
    if (search) {
      query += ` AND (p.name ILIKE $${idx++} OR p.description ILIKE $${idx-1})`;
      params.push(`%${search}%`);
    }
    query += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  },

  async findBySlug(slug) {
    const { rows } = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1 AND p.is_active = true`,
      [slug]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ category_id, name, slug, description, price, stock, weight, image_url, is_featured }) {
    const { rows } = await db.query(
      `INSERT INTO products (category_id, name, slug, description, price, stock, weight, image_url, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [category_id, name, slug, description, price, stock, weight || 100, image_url, is_featured || false]
    );
    return rows[0];
  },

  async update(id, fields) {
    const { category_id, name, slug, description, price, stock, weight, image_url, is_featured, is_active } = fields;
    const { rows } = await db.query(
      `UPDATE products SET category_id=$1, name=$2, slug=$3, description=$4, price=$5,
       stock=$6, weight=$7, image_url=$8, is_featured=$9, is_active=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [category_id, name, slug, description, price, stock, weight, image_url, is_featured, is_active, id]
    );
    return rows[0];
  },

  async delete(id) {
    await db.query(`UPDATE products SET is_active=false WHERE id=$1`, [id]);
  },

  async decreaseStock(id, qty) {
    await db.query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [qty, id]);
  },

  async count() {
    const { rows } = await db.query(`SELECT COUNT(*) FROM products WHERE is_active=true`);
    return parseInt(rows[0].count);
  }
};

module.exports = Product;
