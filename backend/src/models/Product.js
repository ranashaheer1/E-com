const { query } = require('../config/db');
const { mapProduct, slugify } = require('./serialize');

const CATEGORIES = [
  'shirts',
  'pants',
  'shoes',
  'cargo-pants',
  'trousers',
  't-shirts',
  'jackets',
  'hoodies',
];

function buildFilter(filter = {}) {
  const where = [];
  const params = [];
  if (filter.category) {
    where.push('category = ?');
    params.push(String(filter.category).toLowerCase());
  }
  if (filter.featured === true) {
    where.push('featured = 1');
  }
  if (filter.search) {
    where.push('(name LIKE ? OR description LIKE ?)');
    const q = `%${filter.search}%`;
    params.push(q, q);
  }
  if (filter.slug) {
    where.push('slug = ?');
    params.push(String(filter.slug).toLowerCase());
  }
  return { where, params };
}

async function find(filter = {}, { skip = 0, limit = 24, sort = 'created_at' } = {}) {
  const { where, params } = buildFilter(filter);
  const lim = Math.max(1, Number(limit) || 24);
  const off = Math.max(0, Number(skip) || 0);
  const sql = `SELECT * FROM products ${
    where.length ? `WHERE ${where.join(' AND ')}` : ''
  } ORDER BY ${sort} DESC LIMIT ${lim} OFFSET ${off}`;
  const rows = await query(sql, params);
  return rows.map(mapProduct);
}

async function countDocuments(filter = {}) {
  const { where, params } = buildFilter(filter);
  const sql = `SELECT COUNT(*) AS c FROM products ${
    where.length ? `WHERE ${where.join(' AND ')}` : ''
  }`;
  const rows = await query(sql, params);
  return Number(rows[0].c);
}

async function findById(id) {
  if (id == null || id === '') return null;
  const num = Number(id);
  if (!Number.isFinite(num)) return null;
  const rows = await query('SELECT * FROM products WHERE id = ? LIMIT 1', [num]);
  return mapProduct(rows[0]);
}

async function findOne(filter = {}) {
  const { where, params } = buildFilter(filter);
  if (!where.length) return null;
  const rows = await query(
    `SELECT * FROM products WHERE ${where.join(' AND ')} LIMIT 1`,
    params
  );
  return mapProduct(rows[0]);
}

async function create(data) {
  const slug = data.slug || slugify(data.name);
  const result = await query(
    `INSERT INTO products
      (name, slug, category, price, compare_at_price, sizes, images, colorways, description, featured, colors)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      slug,
      data.category,
      data.price,
      data.compareAtPrice ?? null,
      JSON.stringify(data.sizes || []),
      JSON.stringify(data.images || []),
      JSON.stringify(data.colorways || []),
      data.description,
      data.featured ? 1 : 0,
      JSON.stringify(data.colors || []),
    ]
  );
  return findById(result.insertId);
}

async function insertMany(list) {
  const out = [];
  for (const item of list) {
    out.push(await create(item));
  }
  return out;
}

async function findByIdAndUpdate(id, body) {
  const existing = await findById(id);
  if (!existing) return null;
  const next = {
    name: body.name ?? existing.name,
    slug: body.slug ?? existing.slug,
    category: body.category ?? existing.category,
    price: body.price ?? existing.price,
    compareAtPrice:
      body.compareAtPrice !== undefined ? body.compareAtPrice : existing.compareAtPrice,
    sizes: body.sizes ?? existing.sizes,
    images: body.images ?? existing.images,
    colorways: body.colorways ?? existing.colorways,
    description: body.description ?? existing.description,
    featured: body.featured !== undefined ? body.featured : existing.featured,
    colors: body.colors ?? existing.colors,
  };
  await query(
    `UPDATE products SET
      name=?, slug=?, category=?, price=?, compare_at_price=?,
      sizes=?, images=?, colorways=?, description=?, featured=?, colors=?
     WHERE id=?`,
    [
      next.name,
      next.slug || slugify(next.name),
      next.category,
      next.price,
      next.compareAtPrice ?? null,
      JSON.stringify(next.sizes || []),
      JSON.stringify(next.images || []),
      JSON.stringify(next.colorways || []),
      next.description,
      next.featured ? 1 : 0,
      JSON.stringify(next.colors || []),
      Number(id),
    ]
  );
  return findById(id);
}

async function findByIdAndDelete(id) {
  const existing = await findById(id);
  if (!existing) return null;
  await query('DELETE FROM products WHERE id = ?', [Number(id)]);
  return existing;
}

async function save(product) {
  return findByIdAndUpdate(product._id || product.id, product);
}

async function deleteMany() {
  await query('DELETE FROM products');
}

module.exports = {
  CATEGORIES,
  find,
  countDocuments,
  findById,
  findOne,
  create,
  insertMany,
  findByIdAndUpdate,
  findByIdAndDelete,
  save,
  deleteMany,
};
