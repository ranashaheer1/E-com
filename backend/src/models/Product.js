const mongoose = require('mongoose');

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

const sizeStockSchema = new mongoose.Schema(
  {
    size: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const colorwaySchema = new mongoose.Schema(
  {
    color: { type: String, required: true },
    images: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Each colorway needs images',
      },
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    sizes: {
      type: [sizeStockSchema],
      default: [],
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one product image is required',
      },
    },
    /** Optional hang-rail colorways (primary + 2 alts). images[0]=front. */
    colorways: {
      type: [colorwaySchema],
      default: [],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    colors: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

productSchema.pre('validate', function generateSlug(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

productSchema.virtual('inStock').get(function inStock() {
  return this.sizes.some((s) => s.stock > 0);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
module.exports.CATEGORIES = CATEGORIES;
