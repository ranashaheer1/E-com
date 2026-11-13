const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne(
      { email: email.toLowerCase() },
      { withPassword: true }
    );
    if (!user || !(await User.matchPassword(user, password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { password, email } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const envPassword = process.env.ADMIN_PASSWORD;
    let user = null;

    if (envPassword && password === envPassword) {
      user = await User.findOne({
        email: (email || 'admin@unknown.com').toLowerCase(),
        role: 'admin',
      });
      if (!user) {
        user = await User.findOne({ role: 'admin' });
      }
      if (!user) {
        user = await User.create({
          name: 'UNKNOWN Admin',
          email: 'admin@unknown.com',
          password: envPassword,
          role: 'admin',
        });
      }
    } else {
      const adminEmail = (email || 'admin@unknown.com').toLowerCase();
      user = await User.findOne(
        { email: adminEmail, role: 'admin' },
        { withPassword: true }
      );
      if (!user || !(await User.matchPassword(user, password))) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
      }
    }

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
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone || '',
      avatar: req.user.avatar || '',
      bio: req.user.bio || '',
    },
  });
};

module.exports = { register, login, adminLogin, getMe };
