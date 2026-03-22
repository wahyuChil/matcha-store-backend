const db = require('../config/db');

const Order = {
  async create({ order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_province, shipping_postal_code,
    subtotal, shipping_cost, total, notes }) {
    const { rows } = await db.query(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_province, shipping_postal_code,
        subtotal, shipping_cost, total, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [order_number, user_id, customer_name, customer_email, customer_phone,
       shipping_address, shipping_city, shipping_province, shipping_postal_code,
       subtotal, shipping_cost, total, notes]
    );
    return rows[0];
  },

  async createItems(order_id, items) {
    const values = items.map((item, i) => {
      const base = i * 5;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5})`;
    }).join(',');
    const params = [];
    items.forEach(item => {
      params.push(order_id, item.product_id, item.product_name, item.product_price, item.quantity);
    });
    // Add subtotal to params
    const valuesFull = items.map((item, i) => {
      const base = i * 6;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6})`;
    }).join(',');
    const paramsFull = [];
    items.forEach(item => {
      paramsFull.push(order_id, item.product_id, item.product_name, item.product_price, item.quantity, item.subtotal);
    });
    await db.query(
      `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES ${valuesFull}`,
      paramsFull
    );
  },

  async findAll({ status, limit = 20, offset = 0 } = {}) {
    let query = `SELECT o.*, COUNT(oi.id) as item_count FROM orders o
                 LEFT JOIN order_items oi ON o.id = oi.order_id`;
    const params = [];
    if (status) {
      query += ` WHERE o.status = $1`;
      params.push(status);
    }
    query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);
    const { rows } = await db.query(query, params);
    return rows;
  },

  async findById(id) {
    const { rows: orders } = await db.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (!orders[0]) return null;
    const { rows: items } = await db.query(
      `SELECT oi.*, p.image_url FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
      [id]
    );
    return { ...orders[0], items };
  },

  async findByUser(user_id) {
    const { rows } = await db.query(
      `SELECT o.*, COUNT(oi.id) as item_count FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
      [user_id]
    );
    return rows;
  },

  async updateStatus(id, status) {
    const { rows } = await db.query(
      `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, id]
    );
    return rows[0];
  },

  async count() {
    const { rows } = await db.query(`SELECT COUNT(*) FROM orders`);
    return parseInt(rows[0].count);
  },

  async revenue() {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(total),0) as total FROM orders WHERE status NOT IN ('cancelled','pending')`
    );
    return parseFloat(rows[0].total);
  },

  async generateOrderNumber() {
    const now = new Date();
    const datePart = now.toISOString().slice(0,10).replace(/-/g,'');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `MS-${datePart}-${random}`;
  }
};

module.exports = Order;
