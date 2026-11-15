const express = require('express');
const {
  getProducts,
  getProductById,
  getProductBySlug,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

module.exports = router;
