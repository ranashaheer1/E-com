const mysql = require('mysql2/promise');

let pool = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  avatar TEXT,
  bio VARCHAR(280) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(40) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  compare_at_price DECIMAL(12,2) NULL,
  sizes JSON NOT NULL,
  images JSON NOT NULL,
  colorways JSON NULL,
  description TEXT NOT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  colors JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category),
  INDEX idx_products_featured (featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS carts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  size VARCHAR(20) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_cart_items_cart (cart_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  is_guest TINYINT(1) NOT NULL DEFAULT 0,
  shipping_full_name VARCHAR(120) NOT NULL,
  shipping_phone VARCHAR(40) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(80) NOT NULL,
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(80) NOT NULL DEFAULT 'Pakistan',
  shipping_email VARCHAR(255) NOT NULL DEFAULT '',
  payment_method ENUM('cod','card') NOT NULL DEFAULT 'cod',
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  order_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (order_status),
  INDEX idx_orders_created (created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NULL,
  name VARCHAR(255) NOT NULL,
  size VARCHAR(20) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  image TEXT NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT '',
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function connectDB() {
  if (pool) return pool;

  const uri = process.env.DATABASE_URL || process.env.MYSQL_URL || '';
  const connectionLimit = Number(process.env.MYSQL_POOL_SIZE || 5);

  if (uri) {
    pool = mysql.createPool({
      uri,
      waitForConnections: true,
      connectionLimit,
      namedPlaceholders: true,
      timezone: 'Z',
      ssl: process.env.MYSQL_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    });
  } else {
    const host = process.env.MYSQL_HOST || '127.0.0.1';
    const port = Number(process.env.MYSQL_PORT || 3306);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD ?? '';
    const database = process.env.MYSQL_DATABASE || 'unknown_ecommerce';

    if (process.env.MYSQL_SKIP_CREATE_DB !== 'true') {
      const bootstrap = await mysql.createConnection({
        host,
        port,
        user,
        password,
        multipleStatements: true,
      });
      await bootstrap.query(
        `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await bootstrap.end();
    }

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit,
      namedPlaceholders: true,
      timezone: 'Z',
    });
  }

  const conn = await pool.getConnection();
  try {
    const statements = SCHEMA_SQL.split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await conn.query(statement);
    }
  } finally {
    conn.release();
  }

  console.log(
    uri
      ? 'MySQL connected via DATABASE_URL / MYSQL_URL'
      : `MySQL connected: ${process.env.MYSQL_HOST || '127.0.0.1'}`
  );
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('MySQL pool not initialized — call connectDB() first');
  }
  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function withTransaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  connectDB,
  getPool,
  query,
  withTransaction,
  parseJson,
};
