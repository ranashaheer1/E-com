const { query, withTransaction } = require('../config/db');
const { mapOrder, idStr } = require('./serialize');

const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
];

async function loadItems(orderId) {
  return query(
    'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC',
    [Number(orderId)]
  );
}

async function findById(id, { populateUser = false } = {}) {
  const rows = await query('SELECT * FROM orders WHERE id = ? LIMIT 1', [
    Number(id),
  ]);
  const row = rows[0];
  if (!row) return null;
  const items = await loadItems(row.id);
  let user = null;
  if (populateUser && row.user_id) {
    const users = await query(
      'SELECT id, name, email FROM users WHERE id = ? LIMIT 1',
      [row.user_id]
    );
    user = users[0] || null;
  }
  return mapOrder(row, items, user);
}

async function find(filter = {}, { populateUser = false, limit } = {}) {
  const where = [];
  const params = [];

  if (filter.user != null) {
    where.push('user_id = ?');
    params.push(Number(filter.user));
  }
  if (filter.orderStatus) {
    where.push('order_status = ?');
    params.push(filter.orderStatus);
  }
  if (filter.createdAt?.$gte) {
    where.push('created_at >= ?');
    params.push(new Date(filter.createdAt.$gte));
  }
  if (filter.createdAt?.$lte) {
    where.push('created_at <= ?');
    params.push(new Date(filter.createdAt.$lte));
  }
  if (filter.search) {
    const q = `%${String(filter.search).trim()}%`;
    where.push(
      `(shipping_full_name LIKE ? OR shipping_email LIKE ? OR id LIKE ? OR EXISTS (
        SELECT 1 FROM order_items oi WHERE oi.order_id = orders.id AND (oi.name LIKE ? OR oi.category LIKE ?)
      ))`
    );
    params.push(q, q, q, q, q);
  }

  let sql = `SELECT * FROM orders ${
    where.length ? `WHERE ${where.join(' AND ')}` : ''
  } ORDER BY created_at DESC`;
  if (limit) {
    sql += ` LIMIT ${Math.max(1, Number(limit) || 25)}`;
  }

  const rows = await query(sql, params);
  const out = [];
  for (const row of rows) {
    const items = await loadItems(row.id);
    let user = null;
    if (populateUser && row.user_id) {
      const users = await query(
        'SELECT id, name, email FROM users WHERE id = ? LIMIT 1',
        [row.user_id]
      );
      user = users[0] || null;
    }
    out.push(mapOrder(row, items, user));
  }
  return out;
}

async function create(data) {
  return withTransaction(async (conn) => {
    const ship = data.shippingAddress || {};
    const [result] = await conn.execute(
      `INSERT INTO orders
        (user_id, is_guest, shipping_full_name, shipping_phone, shipping_address,
         shipping_city, shipping_postal_code, shipping_country, shipping_email,
         payment_method, payment_status, order_status, total_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user ? Number(data.user) : null,
        data.isGuest ? 1 : 0,
        ship.fullName,
        ship.phone,
        ship.address,
        ship.city,
        ship.postalCode,
        ship.country || 'Pakistan',
        ship.email || '',
        data.paymentMethod || 'cod',
        data.paymentStatus || 'pending',
        data.orderStatus || 'pending',
        Number(data.totalAmount),
        data.createdAt ? new Date(data.createdAt) : new Date(),
        data.updatedAt ? new Date(data.updatedAt) : new Date(),
      ]
    );
    const orderId = result.insertId;
    for (const item of data.items || []) {
      await conn.execute(
        `INSERT INTO order_items
          (order_id, product_id, name, size, quantity, price, image, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product ? Number(item.product) : null,
          item.name,
          item.size,
          Number(item.quantity),
          Number(item.price),
          item.image,
          item.category || '',
        ]
      );
    }
    return orderId;
  }).then((id) => findById(id));
}

async function insertMany(list) {
  const out = [];
  for (const item of list) {
    out.push(await create(item));
  }
  return out;
}

async function save(order) {
  const id = Number(order._id || order.id);
  await query(
    `UPDATE orders SET order_status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [order.orderStatus, order.paymentStatus, id]
  );
  return findById(id, { populateUser: true });
}

async function deleteMany() {
  await query('DELETE FROM order_items');
  await query('DELETE FROM orders');
}

module.exports = {
  ORDER_STATUSES,
  findById,
  find,
  create,
  insertMany,
  save,
  deleteMany,
};
