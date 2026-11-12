const jwt = require('jsonwebtoken');

/**
 * Sign a JWT for the authenticated user.
 */
const generateToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;
