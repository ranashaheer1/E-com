const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { 'shippingAddress.fullName': new RegExp(q, 'i') },
        { 'shippingAddress.email': new RegExp(q, 'i') },
        { 'items.name': new RegExp(q, 'i') },
        { 'items.category': new RegExp(q, 'i') },
      ];
      if (/^[a-f\d]{24}$/i.test(q)) {
        filter.$or.push({ _id: q });
      }
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' });
};

const pctChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const customerKey = (o) =>
  o.user ? String(o.user) : o.shippingAddress?.email || o.shippingAddress?.phone || o._id;

const getDashboardStats = async (req, res, next) => {
  try {
    const period = String(req.query.period || 'this_month');
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    let rangeStart = startThisMonth;
    let rangeEnd = now;
    let compareStart = startLastMonth;
    let compareEnd = endLastMonth;
    let chartYear = now.getFullYear();

    if (period === 'last_month') {
      rangeStart = startLastMonth;
      rangeEnd = endLastMonth;
      compareStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      compareEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
    } else if (period === 'this_year') {
      rangeStart = yearStart;
      rangeEnd = now;
      compareStart = new Date(now.getFullYear() - 1, 0, 1);
      compareEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else {
      // this_month default — compare vs last month
      compareStart = startLastMonth;
      compareEnd = endLastMonth;
    }

    const [
      allOrders,
      registeredUsers,
      productsCount,
      periodOrders,
      compareOrders,
      chartOrders,
      featuredCount,
    ] = await Promise.all([
      Order.find().select(
        'totalAmount orderStatus paymentStatus createdAt shippingAddress items isGuest user'
      ),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }),
      Order.find({ createdAt: { $gte: compareStart, $lte: compareEnd } }),
      Order.find({
        createdAt: {
          $gte: new Date(chartYear, 0, 1),
          $lte: new Date(chartYear, 11, 31, 23, 59, 59, 999),
        },
      }).select('totalAmount orderStatus paymentStatus createdAt'),
      Product.countDocuments({ featured: true }),
    ]);

    const sum = (orders) => orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const periodRevenue = sum(periodOrders);
    const compareRevenue = sum(compareOrders);
    const periodCustomers = new Set(periodOrders.map(customerKey)).size;
    const compareCustomers = new Set(compareOrders.map(customerKey)).size;
    const completedIn = (orders) =>
      orders.filter((o) => ['delivered', 'completed'].includes(o.orderStatus)).length;

    const revenueMap = {};
    for (let m = 0; m < 12; m += 1) {
      const key = `${chartYear}-${String(m + 1).padStart(2, '0')}`;
      revenueMap[key] = { earning: 0, sales: 0, refunds: 0 };
    }
    chartOrders.forEach((order) => {
      const key = monthKey(order.createdAt);
      if (!revenueMap[key]) return;
      revenueMap[key].sales += 1;
      if (order.paymentStatus === 'refunded' || order.orderStatus === 'cancelled') {
        revenueMap[key].refunds += order.totalAmount || 0;
      } else {
        revenueMap[key].earning += order.totalAmount || 0;
      }
    });

    const revenueByMonth = Object.entries(revenueMap).map(([key, value]) => ({
      key,
      month: monthLabel(key),
      ...value,
    }));

    const salesTarget = Math.max(20000, Math.round(periodRevenue * 1.4) || 20000);
    const salesGrowth =
      salesTarget > 0 ? Number(((periodRevenue / salesTarget) * 100).toFixed(1)) : 0;

    const recentSales = [...periodOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 12)
      .map((order) => {
        const categories = [
          ...new Set(order.items.map((i) => i.category).filter(Boolean)),
        ];
        const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
        return {
          _id: order._id,
          orderId: String(order._id).slice(-6).toUpperCase(),
          date: order.createdAt,
          customer: order.shippingAddress?.fullName || 'Guest',
          category: categories.join(', ') || 'General',
          status: order.orderStatus,
          items: itemCount,
          total: order.totalAmount,
          isGuest: order.isGuest,
        };
      });

    const guestCount = allOrders.filter((o) => o.isGuest).length;

    res.json({
      success: true,
      data: {
        period,
        kpis: {
          totalOrders: periodOrders.length,
          totalCustomers: period === 'this_year'
            ? registeredUsers + guestCount
            : periodCustomers,
          totalRevenue: periodRevenue,
          returningBuyers: completedIn(periodOrders),
          pendingOrders: periodOrders.filter((o) => o.orderStatus === 'pending').length,
          productsCount,
          featuredCount,
          trends: {
            orders: pctChange(periodOrders.length, compareOrders.length),
            customers: pctChange(periodCustomers, compareCustomers),
            revenue: pctChange(periodRevenue, compareRevenue),
            returning: pctChange(completedIn(periodOrders), completedIn(compareOrders)),
          },
        },
        revenueByMonth,
        salesOverview: {
          growth: salesGrowth,
          sales: periodRevenue,
          target: salesTarget,
        },
        recentSales,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const since = req.query.since ? new Date(String(req.query.since)) : null;
    const filter = since && !Number.isNaN(since.getTime())
      ? { createdAt: { $gte: since } }
      : {};
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(25)
      .select('shippingAddress totalAmount orderStatus createdAt isGuest items');

    const notifications = orders.map((order) => ({
      _id: order._id,
      type: 'order',
      title: order.isGuest ? 'New guest order' : 'New order',
      message: `${order.shippingAddress?.fullName || 'Customer'} · PKR ${order.totalAmount}`,
      status: order.orderStatus,
      createdAt: order.createdAt,
      href: `/admin/orders`,
      unread: order.orderStatus === 'pending',
    }));

    res.json({
      success: true,
      data: {
        unread: notifications.filter((n) => n.unread).length,
        items: notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const [users, orders] = await Promise.all([
      User.find({ role: 'user' }).select('name email createdAt').sort({ createdAt: -1 }),
      Order.find()
        .select('shippingAddress totalAmount createdAt isGuest user orderStatus')
        .sort({ createdAt: -1 }),
    ]);

    const byKey = new Map();
    users.forEach((u) => {
      byKey.set(String(u._id), {
        _id: u._id,
        name: u.name,
        email: u.email,
        type: 'member',
        orders: 0,
        spent: 0,
        lastOrderAt: null,
        createdAt: u.createdAt,
      });
    });

    orders.forEach((o) => {
      const key = o.user
        ? String(o.user)
        : `guest:${o.shippingAddress?.email || o.shippingAddress?.phone || o._id}`;
      if (!byKey.has(key)) {
        byKey.set(key, {
          _id: key,
          name: o.shippingAddress?.fullName || 'Guest',
          email: o.shippingAddress?.email || '',
          type: 'guest',
          orders: 0,
          spent: 0,
          lastOrderAt: null,
          createdAt: o.createdAt,
        });
      }
      const row = byKey.get(key);
      row.orders += 1;
      row.spent += o.totalAmount || 0;
      if (!row.lastOrderAt || new Date(o.createdAt) > new Date(row.lastOrderAt)) {
        row.lastOrderAt = o.createdAt;
      }
    });

    const data = [...byKey.values()].sort(
      (a, b) => new Date(b.lastOrderAt || b.createdAt) - new Date(a.lastOrderAt || a.createdAt)
    );

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateAdminProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, phone, avatar, bio, password, currentPassword } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;

    if (password) {
      if (!currentPassword || !(await user.matchPassword(currentPassword))) {
        return res.status(400).json({ success: false, message: 'Current password incorrect' });
      }
      user.password = password;
    }

    await user.save();
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
  getNotifications,
  getCustomers,
  updateAdminProfile,
};
