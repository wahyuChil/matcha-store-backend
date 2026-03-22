const Order = require('../models/Order');
const Product = require('../models/Product');

// POST /api/orders - Buat order baru
const createOrder = async (req, res) => {
  try {
    const {
      customer_name, customer_email, customer_phone,
      shipping_address, shipping_city, shipping_province, shipping_postal_code,
      items, notes
    } = req.body;

    // Validasi input
    if (!customer_name || !customer_email || !customer_phone ||
        !shipping_address || !shipping_city || !shipping_province || !shipping_postal_code) {
      return res.status(400).json({ success: false, message: 'Semua data pengiriman wajib diisi.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang belanja kosong.' });
    }

    // Validasi stok dan hitung subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Produk ID ${item.product_id} tidak ditemukan.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Stok ${product.name} tidak cukup. Tersisa: ${product.stock}` });
      }
      const itemSubtotal = parseFloat(product.price) * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    const shippingCost = parseFloat(process.env.SHIPPING_COST) || 10000;
    const total = subtotal + shippingCost;
    const order_number = await Order.generateOrderNumber();
    const user_id = req.user ? req.user.id : null;

    const order = await Order.create({
      order_number, user_id, customer_name, customer_email, customer_phone,
      shipping_address, shipping_city, shipping_province, shipping_postal_code,
      subtotal, shipping_cost: shippingCost, total, notes
    });

    await Order.createItems(order.id, orderItems);

    // Kurangi stok
    for (const item of orderItems) {
      await Product.decreaseStock(item.product_id, item.quantity);
    }

    const paymentInfo = {
      bank_bca: process.env.BANK_BCA,
      bank_mandiri: process.env.BANK_MANDIRI,
      bank_bri: process.env.BANK_BRI,
      account_name: process.env.BANK_ACCOUNT_NAME,
      whatsapp: `https://wa.me/${process.env.WHATSAPP_NUMBER}?text=Halo+admin%2C+saya+sudah+transfer+untuk+order+%23${order.order_number}`
    };

    res.status(201).json({
      success: true,
      message: 'Order berhasil dibuat! Silakan lakukan pembayaran.',
      data: { ...order, items: orderItems },
      payment_info: paymentInfo
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat order.' });
  }
};

// GET /api/orders/my - Order milik user yang login
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findByUser(req.user.id);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data order.' });
  }
};

// GET /api/orders/:id - Detail order
const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
    // Pastikan hanya pemilik atau admin yang bisa lihat
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil order.' });
  }
};

// ---- ADMIN ----

// GET /api/admin/orders
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const orders = await Order.findAll({ status, limit: parseInt(limit), offset: (page-1)*parseInt(limit) });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil order.' });
  }
};

// PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending','paid','processing','shipped','delivered','cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }
    const order = await Order.updateStatus(req.params.id, status);
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
    res.json({ success: true, message: 'Status order berhasil diupdate.', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengupdate status.' });
  }
};

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [totalProducts, totalOrders, revenue] = await Promise.all([
      Product.count(), Order.count(), Order.revenue()
    ]);
    const recentOrders = await Order.findAll({ limit: 5, offset: 0 });
    res.json({
      success: true,
      data: { totalProducts, totalOrders, revenue, recentOrders }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil dashboard.' });
  }
};

module.exports = { createOrder, getMyOrders, getOrderDetail, getAllOrders, updateOrderStatus, getDashboard };
