const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { mapUser, idStr } = require('./serialize');

async function findById(id, { withPassword = false } = {}) {
  const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [Number(id)]);
  return mapUser(rows[0], { withPassword });
}

async function findOne({ email, role } = {}, { withPassword = false } = {}) {
  const where = [];
  const params = [];
  if (email) {
    where.push('email = ?');
    params.push(String(email).toLowerCase());
  }
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  if (!where.length) return null;
  const rows = await query(
    `SELECT * FROM users WHERE ${where.join(' AND ')} LIMIT 1`,
    params
  );
  return mapUser(rows[0], { withPassword });
}

async function create(data) {
  const password = await bcrypt.hash(String(data.password), 10);
  const result = await query(
    `INSERT INTO users (name, email, password, role, phone, avatar, bio)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      String(data.email).toLowerCase(),
      password,
      data.role || 'user',
      data.phone || '',
      data.avatar || '',
      data.bio || '',
    ]
  );
  return findById(result.insertId);
}

async function countDocuments(filter = {}) {
  const where = [];
  const params = [];
  if (filter.role) {
    where.push('role = ?');
    params.push(filter.role);
  }
  const sql = where.length
    ? `SELECT COUNT(*) AS c FROM users WHERE ${where.join(' AND ')}`
    : 'SELECT COUNT(*) AS c FROM users';
  const rows = await query(sql, params);
  return Number(rows[0].c);
}

async function find(filter = {}, { select } = {}) {
  const where = [];
  const params = [];
  if (filter.role) {
    where.push('role = ?');
    params.push(filter.role);
  }
  const sql = `SELECT * FROM users ${
    where.length ? `WHERE ${where.join(' AND ')}` : ''
  } ORDER BY created_at DESC`;
  const rows = await query(sql, params);
  return rows.map((r) => mapUser(r, { withPassword: false }));
}

async function matchPassword(user, enteredPassword) {
  if (!user?.password) {
    const full = await findById(user._id || user.id, { withPassword: true });
    if (!full?.password) return false;
    return bcrypt.compare(enteredPassword, full.password);
  }
  return bcrypt.compare(enteredPassword, user.password);
}

async function save(user) {
  const id = Number(user._id || user.id);
  const updates = [];
  const params = [];

  if (user.name != null) {
    updates.push('name = ?');
    params.push(user.name);
  }
  if (user.email != null) {
    updates.push('email = ?');
    params.push(String(user.email).toLowerCase());
  }
  if (user.phone !== undefined) {
    updates.push('phone = ?');
    params.push(user.phone || '');
  }
  if (user.avatar !== undefined) {
    updates.push('avatar = ?');
    params.push(user.avatar || '');
  }
  if (user.bio !== undefined) {
    updates.push('bio = ?');
    params.push(user.bio || '');
  }
  if (user.password && !String(user.password).startsWith('$2')) {
    updates.push('password = ?');
    params.push(await bcrypt.hash(String(user.password), 10));
  }

  if (updates.length) {
    params.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }
  return findById(id);
}

async function deleteMany() {
  await query('DELETE FROM users');
}

module.exports = {
  findById,
  findOne,
  create,
  countDocuments,
  find,
  matchPassword,
  save,
  deleteMany,
  idStr,
};
