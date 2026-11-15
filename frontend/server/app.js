const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { configureCloudinary } = require("./config/cloudinary");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

configureCloudinary();

const app = express();

let dbReady = null;
function ensureDb(req, res, next) {
  if (!dbReady) {
    dbReady = connectDB().catch((err) => {
      dbReady = null;
      throw err;
    });
  }
  dbReady
    .then(() => next())
    .catch((err) => {
      console.error("DB connect failed:", err.message);
      res.status(503).json({
        success: false,
        message:
          "Database unavailable. Set MYSQL_* (or DATABASE_URL) in environment.",
      });
    });
}

const corsOptions = {
  origin(origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(ensureDb);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "UNKNOWN API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
