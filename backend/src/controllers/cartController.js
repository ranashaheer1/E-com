const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, size, quantity = 1 } = req.body;

    if (!productId || !size) {
      return res.status(400).json({ success: false, message: 'productId and size are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const sizeEntry = product.sizes.find((s) => s.size === size);
    if (!sizeEntry || sizeEntry.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Selected size is out of stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const items = [...(cart.items || [])];
    const existing = items.find(
      (item) =>
        String(item.product?._id || item.product) === String(productId) &&
        item.size === size
    );

    if (existing) {
      existing.quantity += Number(quantity);
      existing.price = product.price;
    } else {
      items.push({
        product: product._id,
        size,
        quantity: Number(quantity),
        price: product.price,
      });
    }

    cart = await Cart.save({ ...cart, items, user: req.user._id });
    res.status(201).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemId = String(req.params.itemId);
    let items = [...(cart.items || [])];
    const idx = items.findIndex((item) => String(item._id) === itemId);
    if (idx < 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (quantity <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx] = { ...items[idx], quantity: Number(quantity) };
    }

    cart = await Cart.save({ ...cart, items, user: req.user._id });
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemId = String(req.params.itemId);
    const items = (cart.items || []).filter((item) => String(item._id) !== itemId);
    if (items.length === (cart.items || []).length) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    cart = await Cart.save({ ...cart, items, user: req.user._id });
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    cart = await Cart.save({ ...cart, items: [], user: req.user._id });
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
