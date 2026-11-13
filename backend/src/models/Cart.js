const { query } = require('../config/db');
const { idStr, mapProduct } = require('./serialize');

async function loadCartRow(userId) {
  const rows = await query('SELECT * FROM carts WHERE user_id = ? LIMIT 1', [
    Number(userId),
  ]);
  return rows[0] || null;
}

async function loadItems(cartId, { populateProduct = true } = {}) {
  const rows = await query(
    `SELECT ci.*, p.name AS p_name, p.slug AS p_slug, p.category AS p_category,
            p.price AS p_price, p.images AS p_images, p.sizes AS p_sizes,
            p.colorways AS p_colorways, p.description AS p_description,
            p.featured AS p_featured, p.colors AS p_colors,
            p.compare_at_price AS p_compare_at_price,
            p.created_at AS p_created_at, p.updated_at AS p_updated_at
     FROM cart_items ci
     LEFT JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.id ASC`,
    [Number(cartId)]
  );

  return rows.map((row) => {
    const item = {
      _id: idStr(row.id),
      id: row.id,
      product: populateProduct
        ? mapProduct({
            id: row.product_id,
            name: row.p_name,
            slug: row.p_slug,
            category: row.p_category,
            price: row.p_price,
            compare_at_price: row.p_compare_at_price,
            sizes: row.p_sizes,
            images: row.p_images,
            colorways: row.p_colorways,
            description: row.p_description,
            featured: row.p_featured,
            colors: row.p_colors,
            created_at: row.p_created_at,
            updated_at: row.p_updated_at,
          })
        : idStr(row.product_id),
      size: row.size,
      quantity: Number(row.quantity),
      price: Number(row.price),
    };
    return item;
  });
}

function withSubtotal(cart) {
  if (!cart) return null;
  cart.subtotal = (cart.items || []).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );
  return cart;
}

async function shapeCart(cartRow, { populate = true } = {}) {
  if (!cartRow) return null;
  const items = await loadItems(cartRow.id, { populateProduct: populate });
  return withSubtotal({
    _id: idStr(cartRow.id),
    id: cartRow.id,
    user: idStr(cartRow.user_id),
    items,
    createdAt: cartRow.created_at,
    updatedAt: cartRow.updated_at,
  });
}

async function findOne({ user } = {}) {
  const row = await loadCartRow(user);
  return shapeCart(row, { populate: true });
}

async function create({ user, items = [] }) {
  const result = await query('INSERT INTO carts (user_id) VALUES (?)', [Number(user)]);
  const cartId = result.insertId;
  for (const item of items) {
    await query(
      `INSERT INTO cart_items (cart_id, product_id, size, quantity, price)
       VALUES (?, ?, ?, ?, ?)`,
      [
        cartId,
        Number(item.product),
        item.size,
        Number(item.quantity) || 1,
        Number(item.price),
      ]
    );
  }
  return findOne({ user });
}

async function save(cart) {
  const cartId = Number(cart._id || cart.id);
  const userId = Number(cart.user);

  // Replace items snapshot
  await query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  for (const item of cart.items || []) {
    const productId = Number(
      item.product?._id || item.product?.id || item.product
    );
    await query(
      `INSERT INTO cart_items (cart_id, product_id, size, quantity, price)
       VALUES (?, ?, ?, ?, ?)`,
      [cartId, productId, item.size, Number(item.quantity) || 1, Number(item.price)]
    );
  }
  await query('UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
    cartId,
  ]);
  return findOne({ user: userId });
}

async function deleteMany() {
  await query('DELETE FROM cart_items');
  await query('DELETE FROM carts');
}

module.exports = {
  findOne,
  create,
  save,
  deleteMany,
};
