const Product = require('../models/Product');

const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      featured,
      search,
      page = 1,
      limit = 24,
    } = req.query;

    const filter = {};
    if (category) filter.category = String(category).toLowerCase();
    if (featured === 'true') filter.featured = true;
    if (search) filter.search = String(search);

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(60, Math.max(1, Number(limit) || 24));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter, { skip, limit: limitNum }),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const key = String(req.params.id || '').trim();
    let product = await Product.findById(key);
    if (!product) {
      product = await Product.findOne({ slug: key.toLowerCase() });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProductById, getProductBySlug };
