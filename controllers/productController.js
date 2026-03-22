const Product = require('../models/Product');
const Category = require('../models/Category');

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, featured, search, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.findAll({
      categorySlug: category,
      featured: featured === 'true',
      search,
      limit: parseInt(limit),
      offset
    });
    res.json({ success: true, data: products, total: products.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data produk.' });
  }
};

// GET /api/products/:slug
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findBySlug(req.params.slug);
    if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil produk.' });
  }
};

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const cats = await Category.findAll();
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori.' });
  }
};

// ---- ADMIN ----

// POST /api/admin/products
const createProduct = async (req, res) => {
  try {
    const { category_id, name, description, price, stock, weight, image_url, is_featured } = req.body;
    if (!name || !price) return res.status(400).json({ success: false, message: 'Nama dan harga wajib diisi.' });
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const product = await Product.create({ category_id, name, slug, description, price, stock, weight, image_url, is_featured });
    res.status(201).json({ success: true, message: 'Produk berhasil dibuat.', data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal membuat produk.' });
  }
};

// PUT /api/admin/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Product.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    const fields = {
      category_id: req.body.category_id ?? existing.category_id,
      name: req.body.name ?? existing.name,
      slug: req.body.name ? req.body.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') + '-' + id : existing.slug,
      description: req.body.description ?? existing.description,
      price: req.body.price ?? existing.price,
      stock: req.body.stock ?? existing.stock,
      weight: req.body.weight ?? existing.weight,
      image_url: req.body.image_url ?? existing.image_url,
      is_featured: req.body.is_featured ?? existing.is_featured,
      is_active: req.body.is_active ?? existing.is_active,
    };
    const product = await Product.update(id, fields);
    res.json({ success: true, message: 'Produk berhasil diupdate.', data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate produk.' });
  }
};

// DELETE /api/admin/products/:id
const deleteProduct = async (req, res) => {
  try {
    await Product.delete(req.params.id);
    res.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
  }
};

// GET /api/admin/products (all including inactive)
const getAllProductsAdmin = async (req, res) => {
  try {
    const { rows } = await require('../config/db').query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil produk.' });
  }
};

module.exports = { getProducts, getProductBySlug, getCategories, createProduct, updateProduct, deleteProduct, getAllProductsAdmin };
