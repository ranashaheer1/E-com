const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const buildOrderItemsFromLines = async (lines) => {
  const orderItems = [];
  let totalAmount = 0;
  const stockUpdates = [];

  for (const line of lines) {
    const productId = line.productId || line.product;
    const quantity = Number(line.quantity) || 1;
    const size = line.size;

    if (!productId || !size) {
      const err = new Error('Each item needs productId and size');
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('A product in your cart no longer exists');
      err.statusCode = 400;
      throw err;
    }

    const sizeEntry = product.sizes.find((s) => s.size === size);
    if (!sizeEntry || sizeEntry.stock < quantity) {
      const err = new Error(`Insufficient stock for ${product.name} (${size})`);
      err.statusCode = 400;
      throw err;
    }

    sizeEntry.stock -= quantity;
    stockUpdates.push(product);

    const price = product.price;
    orderItems.push({
      product: product._id,
      name: product.name,
      size,
      quantity,
      price,
      image: product.images[0],
      category: product.category,
    });
    totalAmount += price * quantity;
  }

  for (const product of stockUpdates) {
    await Product.save(product);
  }

  return { orderItems, totalAmount };
};

const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'cod', items: bodyItems } = req.body;

    if (
      !shippingAddress?.fullName ||
      !shippingAddress?.phone ||
      !shippingAddress?.address ||
      !shippingAddress?.city ||
      !shippingAddress?.postalCode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required',
      });
    }

    const isGuest = !req.user;
    let orderItems;
    let totalAmount;
    let cart = null;

    if (Array.isArray(bodyItems) && bodyItems.length > 0) {
      ({ orderItems, totalAmount } = await buildOrderItemsFromLines(bodyItems));
    } else if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      const lines = cart.items.map((item) => ({
        productId: item.product?._id || item.product,
        size: item.size,
        quantity: item.quantity,
      }));
      ({ orderItems, totalAmount } = await buildOrderItemsFromLines(lines));
    } else {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required for guest checkout',
      });
    }

    const order = await Order.create({
      user: req.user?._id || null,
      isGuest,
      items: orderItems,
      shippingAddress: {
        ...shippingAddress,
        country: shippingAddress.country || 'Pakistan',
        email: shippingAddress.email || '',
      },
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      totalAmount,
    });

    if (cart) {
      await Cart.save({ ...cart, items: [], user: req.user._id });
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isOwner =
      order.user && req.user && String(order.user) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getOrderById };
