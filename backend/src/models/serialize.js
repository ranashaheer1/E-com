const { parseJson } = require('../config/db');

function idStr(id) {
  return id == null ? null : String(id);
}

function mapUser(row, { withPassword = false } = {}) {
  if (!row) return null;
  const user = {
    _id: idStr(row.id),
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone || '',
    avatar: row.avatar || '',
    bio: row.bio || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (withPassword) user.password = row.password;
  return user;
}

function mapProduct(row) {
  if (!row) return null;
  const sizes = parseJson(row.sizes, []);
  const images = parseJson(row.images, []);
  const colorways = parseJson(row.colorways, []);
  const colors = parseJson(row.colors, []);
  return {
    _id: idStr(row.id),
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
    sizes,
    images,
    colorways,
    description: row.description,
    featured: Boolean(row.featured),
    colors,
    inStock: Array.isArray(sizes) && sizes.some((s) => Number(s.stock) > 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrder(row, items = [], user = null) {
  if (!row) return null;
  return {
    _id: idStr(row.id),
    id: row.id,
    user: user
      ? { _id: idStr(user.id), name: user.name, email: user.email }
      : row.user_id != null
        ? idStr(row.user_id)
        : null,
    isGuest: Boolean(row.is_guest),
    items: items.map((it) => ({
      product: idStr(it.product_id),
      name: it.name,
      size: it.size,
      quantity: Number(it.quantity),
      price: Number(it.price),
      image: it.image,
      category: it.category || '',
    })),
    shippingAddress: {
      fullName: row.shipping_full_name,
      phone: row.shipping_phone,
      address: row.shipping_address,
      city: row.shipping_city,
      postalCode: row.shipping_postal_code,
      country: row.shipping_country || 'Pakistan',
      email: row.shipping_email || '',
    },
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

module.exports = {
  idStr,
  mapUser,
  mapProduct,
  mapOrder,
  slugify,
};
