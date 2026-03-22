const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderDetail } = require('../controllers/orderController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
router.post('/', optionalAuth, createOrder);
router.get('/my', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrderDetail);
module.exports = router;
