const express = require('express');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
  getNotifications,
  getCustomers,
  updateAdminProfile,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/notifications', getNotifications);
router.get('/customers', getCustomers);
router.put('/profile', updateAdminProfile);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
