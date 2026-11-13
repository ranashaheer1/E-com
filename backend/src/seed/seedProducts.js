require('dotenv').config();

const { connectDB } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const apparelSizes = (stock = 12) =>
  ['S', 'M', 'L', 'XL', 'XXL'].map((size) => ({ size, stock }));

const shoeSizes = (stock = 8) =>
  ['40', '41', '42', '43', '44', '45'].map((size) => ({ size, stock }));

/** Primary + 2 alt hang-rail colorways */
const colorways = (dir, stem, base, c2, c3) => [
  {
    color: base,
    images: [
      `/products/hanging/${dir}/${stem}-front.png`,
      `/products/hanging/${dir}/${stem}-back.png`,
    ],
  },
  {
    color: c2,
    images: [
      `/products/hanging/${dir}/${stem}-c2-front.png`,
      `/products/hanging/${dir}/${stem}-c2-back.png`,
    ],
  },
  {
    color: c3,
    images: [
      `/products/hanging/${dir}/${stem}-c3-front.png`,
      `/products/hanging/${dir}/${stem}-c3-back.png`,
    ],
  },
];

/** Reliable Unsplash fashion assets used across the storefront */
const IMG = {
  shirt1: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
  shirt2: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',
  shirt3: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=80',
  shirt4: 'https://images.unsplash.com/photo-1620012253295-6b9f314c4d3e?auto=format&fit=crop&w=900&q=80',
  denim1: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=900&q=80',
  pant1: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
  pant2: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80',
  shoe1: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  shoe2: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80',
  shoe3: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80',
  shoe4: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=900&q=80',
  shoe5: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80',
  shoe6: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80',
  tee1: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  tee2: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80',
  tee3: 'https://images.unsplash.com/photo-1576566588028-4147f3842fbf?auto=format&fit=crop&w=900&q=80',
  tee4: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',
  jacket1: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',
  jacket2: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=900&q=80',
  jacket3: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=80',
  jacket4: 'https://images.unsplash.com/photo-1591047139829-d91aecb6ca87?auto=format&fit=crop&w=900&q=80',
  hoodie1: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
  hoodie2: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80',
  hoodie3: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=900&q=80',
  hoodie4: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
};

const LOCAL = {
  // Drop rail still uses tee1–3 / pant1–3 / trouser1–3 / jacket1–3 files on disk.
  // Category pages use the redesigned sets below.
  tee4Front: '/products/hanging/shirts/tee4-front.png',
  tee4Back: '/products/hanging/shirts/tee4-back.png',
  tee5Front: '/products/hanging/shirts/tee5-front.png',
  tee5Back: '/products/hanging/shirts/tee5-back.png',
  tee6Front: '/products/hanging/shirts/tee6-front.png',
  tee6Back: '/products/hanging/shirts/tee6-back.png',
  tee7Front: '/products/hanging/shirts/tee7-front.png',
  tee7Back: '/products/hanging/shirts/tee7-back.png',
  tee8Front: '/products/hanging/shirts/tee8-front.png',
  tee8Back: '/products/hanging/shirts/tee8-back.png',
  tee9Front: '/products/hanging/shirts/tee9-front.png',
  tee9Back: '/products/hanging/shirts/tee9-back.png',
  tee10Front: '/products/hanging/shirts/tee10-front.png',
  tee10Back: '/products/hanging/shirts/tee10-back.png',
  tee11Front: '/products/hanging/shirts/tee11-front.png',
  tee11Back: '/products/hanging/shirts/tee11-back.png',
  tee12Front: '/products/hanging/shirts/tee12-front.png',
  tee12Back: '/products/hanging/shirts/tee12-back.png',
  tee13Front: '/products/hanging/shirts/tee13-front.png',
  tee13Back: '/products/hanging/shirts/tee13-back.png',
  pant4Front: '/products/hanging/pants/pant4-front.png',
  pant4Back: '/products/hanging/pants/pant4-back.png',
  pant5Front: '/products/hanging/pants/pant5-front.png',
  pant5Back: '/products/hanging/pants/pant5-back.png',
  pant6Front: '/products/hanging/pants/pant6-front.png',
  pant6Back: '/products/hanging/pants/pant6-back.png',
  pant7Front: '/products/hanging/pants/pant7-front.png',
  pant7Back: '/products/hanging/pants/pant7-back.png',
  pant8Front: '/products/hanging/pants/pant8-front.png',
  pant8Back: '/products/hanging/pants/pant8-back.png',
  pant9Front: '/products/hanging/pants/pant9-front.png',
  pant9Back: '/products/hanging/pants/pant9-back.png',
  trouser4Front: '/products/hanging/trousers/trouser4-front.png',
  trouser4Back: '/products/hanging/trousers/trouser4-back.png',
  trouser5Front: '/products/hanging/trousers/trouser5-front.png',
  trouser5Back: '/products/hanging/trousers/trouser5-back.png',
  trouser6Front: '/products/hanging/trousers/trouser6-front.png',
  trouser6Back: '/products/hanging/trousers/trouser6-back.png',
  trouser7Front: '/products/hanging/trousers/trouser7-front.png',
  trouser7Back: '/products/hanging/trousers/trouser7-back.png',
  trouser8Front: '/products/hanging/trousers/trouser8-front.png',
  trouser8Back: '/products/hanging/trousers/trouser8-back.png',
  trouser9Front: '/products/hanging/trousers/trouser9-front.png',
  trouser9Back: '/products/hanging/trousers/trouser9-back.png',
  jacket4Front: '/products/hanging/jackets/jacket4-front.png',
  jacket4Back: '/products/hanging/jackets/jacket4-back.png',
  jacket5Front: '/products/hanging/jackets/jacket5-front.png',
  jacket5Back: '/products/hanging/jackets/jacket5-back.png',
  jacket6Front: '/products/hanging/jackets/jacket6-front.png',
  jacket6Back: '/products/hanging/jackets/jacket6-back.png',
  jacket7Front: '/products/hanging/jackets/jacket7-front.png',
  jacket7Back: '/products/hanging/jackets/jacket7-back.png',
  jacket8Front: '/products/hanging/jackets/jacket8-front.png',
  jacket8Back: '/products/hanging/jackets/jacket8-back.png',
  jacket9Front: '/products/hanging/jackets/jacket9-front.png',
  jacket9Back: '/products/hanging/jackets/jacket9-back.png',
  hoodie1Front: '/products/hanging/hoodies/hoodie1-front.png',
  hoodie1Back: '/products/hanging/hoodies/hoodie1-back.png',
  hoodie2Front: '/products/hanging/hoodies/hoodie2-front.png',
  hoodie2Back: '/products/hanging/hoodies/hoodie2-back.png',
  hoodie3Front: '/products/hanging/hoodies/hoodie3-front.png',
  hoodie3Back: '/products/hanging/hoodies/hoodie3-back.png',
  hoodie4Front: '/products/hanging/hoodies/hoodie4-front.png',
  hoodie4Back: '/products/hanging/hoodies/hoodie4-back.png',
  shoe1: '/products/shoes/shoe1-chicago.png',
  shoe2: '/products/shoes/shoe2-olive.png',
  shoe3: '/products/shoes/shoe3-af1.png',
  shoe4: '/products/shoes/shoe4-teal-low.png',
  shoe5: '/products/shoes/shoe5-royal.png',
  shoe6: '/products/shoes/shoe6-samba.png',
  shoe7: '/products/shoes/shoe7-bred.png',
  shoe8: '/products/shoes/shoe8-bounce.png',
};

const products = [
  {
    name: 'UNKNOWN Coral Mark Tee',
    category: 'shirts',
    price: 3490,
    featured: true,
    colors: ['#0a0a0a', '#1e3a5f', '#3d4f3a'],
    colorways: colorways('shirts', 'tee4', '#0a0a0a', '#1e3a5f', '#3d4f3a'),
    sizes: apparelSizes(20),
    images: [LOCAL.tee4Front, LOCAL.tee4Back],
    description: 'Men’s black drop-shoulder heavyweight with coral UNKNOWN chest mark.',
  },
  {
    name: 'UNKNOWN Block Mark Tee',
    category: 'shirts',
    price: 3690,
    featured: true,
    colors: ['#0a0a0a', '#4a4a4a', '#6b1e2e'],
    colorways: colorways('shirts', 'tee5', '#0a0a0a', '#4a4a4a', '#6b1e2e'),
    sizes: apparelSizes(18),
    images: [LOCAL.tee5Front, LOCAL.tee5Back],
    description: 'Men’s black boxy tee with white UNKNOWN left-chest block mark.',
  },
  {
    name: 'UNKNOWN Olive 07 Tee',
    category: 'shirts',
    price: 3590,
    featured: true,
    colors: ['#556b2f', '#0a0a0a', '#3b2a22'],
    colorways: colorways('shirts', 'tee6', '#556b2f', '#0a0a0a', '#3b2a22'),
    sizes: apparelSizes(18),
    images: [LOCAL.tee6Front, LOCAL.tee6Back],
    description: 'Men’s olive drop-shoulder tee with vintage distressed 07.',
  },
  {
    name: 'UNKNOWN Strike Stripe Tee',
    category: 'shirts',
    price: 3790,
    featured: true,
    colors: ['#ffffff', '#0a0a0a', '#1e3a5f'],
    colorways: colorways('shirts', 'tee7', '#ffffff', '#0a0a0a', '#1e3a5f'),
    sizes: apparelSizes(16),
    images: [LOCAL.tee7Front, LOCAL.tee7Back],
    description: 'Men’s white boxy tee with navy chest stripe and STRIKE mark.',
  },
  {
    name: 'UNKNOWN Kanji Column Tee',
    category: 'shirts',
    price: 3890,
    featured: true,
    colors: ['#3a3a3a', '#0a0a0a', '#1e3a5f'],
    colorways: colorways('shirts', 'tee8', '#3a3a3a', '#0a0a0a', '#1e3a5f'),
    sizes: apparelSizes(16),
    images: [LOCAL.tee8Front, LOCAL.tee8Back],
    description: 'Men’s charcoal drop-shoulder with vertical column graphic.',
  },
  {
    name: 'UNKNOWN Circle Mark Tee',
    category: 'shirts',
    price: 3490,
    featured: false,
    colors: ['#6b1e2e', '#0a0a0a', '#1e3a5f'],
    colorways: colorways('shirts', 'tee9', '#6b1e2e', '#0a0a0a', '#1e3a5f'),
    sizes: apparelSizes(18),
    images: [LOCAL.tee9Front, LOCAL.tee9Back],
    description: 'Men’s burgundy oversized tee with cream circle chest mark.',
  },
  {
    name: 'UNKNOWN Script Wash Tee',
    category: 'shirts',
    price: 3690,
    featured: false,
    colors: ['#6b8cae', '#0a0a0a', '#3b2a22'],
    colorways: colorways('shirts', 'tee10', '#6b8cae', '#0a0a0a', '#3b2a22'),
    sizes: apparelSizes(16),
    images: [LOCAL.tee10Front, LOCAL.tee10Back],
    description: 'Men’s dusty-blue washed tee with white UNKNOWN script.',
  },
  {
    name: 'UNKNOWN Peak Line Tee',
    category: 'shirts',
    price: 3590,
    featured: false,
    colors: ['#c4b59a', '#0a0a0a', '#556b2f'],
    colorways: colorways('shirts', 'tee11', '#c4b59a', '#0a0a0a', '#556b2f'),
    sizes: apparelSizes(16),
    images: [LOCAL.tee11Front, LOCAL.tee11Back],
    description: 'Men’s sand drop-shoulder with mountain line graphic.',
  },
  {
    name: 'UNKNOWN Orbit Tee',
    category: 'shirts',
    price: 3790,
    featured: false,
    colors: ['#1f3d2b', '#0a0a0a', '#3b2a22'],
    colorways: colorways('shirts', 'tee12', '#1f3d2b', '#0a0a0a', '#3b2a22'),
    sizes: apparelSizes(14),
    images: [LOCAL.tee12Front, LOCAL.tee12Back],
    description: 'Men’s forest green boxy tee with geometric orbit mark.',
  },
  {
    name: 'UNKNOWN Eighty-Eight Tee',
    category: 'shirts',
    price: 3890,
    featured: false,
    colors: ['#1e3a5f', '#0a0a0a', '#4a4a4a'],
    colorways: colorways('shirts', 'tee13', '#1e3a5f', '#0a0a0a', '#4a4a4a'),
    sizes: apparelSizes(14),
    images: [LOCAL.tee13Front, LOCAL.tee13Back],
    description: 'Men’s navy athletic tee with cream 88 chest number.',
  },
  {
    name: 'UNKNOWN Indigo Straight',
    category: 'pants',
    price: 6990,
    featured: true,
    colors: ['#3b6ea5', '#0a0a0a', '#2a2a2a'],
    colorways: colorways('pants', 'pant4', '#3b6ea5', '#0a0a0a', '#2a2a2a'),
    sizes: apparelSizes(20),
    images: [LOCAL.pant4Front, LOCAL.pant4Back],
    description: 'Men’s medium-wash indigo straight denim on the rail.',
  },
  {
    name: 'UNKNOWN Black Baggy',
    category: 'pants',
    price: 7490,
    featured: true,
    colors: ['#0a0a0a', '#1e3a5f', '#3b2a22'],
    colorways: colorways('pants', 'pant5', '#0a0a0a', '#1e3a5f', '#3b2a22'),
    sizes: apparelSizes(18),
    images: [LOCAL.pant5Front, LOCAL.pant5Back],
    description: 'Men’s faded black baggy wide denim with soft drape.',
  },
  {
    name: 'UNKNOWN Acid Baggy',
    category: 'pants',
    price: 7590,
    featured: true,
    colors: ['#9bb4c8', '#3b6ea5', '#0a0a0a'],
    colorways: colorways('pants', 'pant6', '#9bb4c8', '#3b6ea5', '#0a0a0a'),
    sizes: apparelSizes(18),
    images: [LOCAL.pant6Front, LOCAL.pant6Back],
    description: 'Men’s light acid-wash baggy jeans with thigh fade.',
  },
  {
    name: 'UNKNOWN Olive Carpenter',
    category: 'pants',
    price: 7290,
    featured: false,
    colors: ['#556b2f', '#0a0a0a', '#3b2a22'],
    colorways: colorways('pants', 'pant7', '#556b2f', '#0a0a0a', '#3b2a22'),
    sizes: apparelSizes(16),
    images: [LOCAL.pant7Front, LOCAL.pant7Back],
    description: 'Men’s olive carpenter work pant with side tool pocket.',
  },
  {
    name: 'UNKNOWN Heather Slim',
    category: 'pants',
    price: 6890,
    featured: false,
    colors: ['#6b6b6b', '#0a0a0a', '#1e3a5f'],
    colorways: colorways('pants', 'pant8', '#6b6b6b', '#0a0a0a', '#1e3a5f'),
    sizes: apparelSizes(16),
    images: [LOCAL.pant8Front, LOCAL.pant8Back],
    description: 'Men’s heather gray slim-straight denim.',
  },
  {
    name: 'UNKNOWN Cocoa Work',
    category: 'pants',
    price: 7190,
    featured: false,
    colors: ['#5c4033', '#0a0a0a', '#556b2f'],
    colorways: colorways('pants', 'pant9', '#5c4033', '#0a0a0a', '#556b2f'),
    sizes: apparelSizes(14),
    images: [LOCAL.pant9Front, LOCAL.pant9Back],
    description: 'Men’s chocolate brown work denim with sturdy stitch.',
  },
  {
    name: 'UNKNOWN Chicago High',
    category: 'shoes',
    price: 18990,
    featured: true,
    colors: ['#c8102e', '#ffffff', '#0a0a0a'],
    sizes: shoeSizes(),
    images: [LOCAL.shoe1, LOCAL.shoe1],
    description: 'Classic high-top court sneaker in red, white, and black.',
  },
  {
    name: 'UNKNOWN Olive Cage',
    category: 'shoes',
    price: 12990,
    featured: true,
    colors: ['#556b2f', '#ffffff'],
    sizes: shoeSizes(6),
    images: [LOCAL.shoe2, LOCAL.shoe2],
    description: 'Olive knit trainer with honeycomb midfoot cage.',
  },
  {
    name: 'UNKNOWN Force White',
    category: 'shoes',
    price: 11990,
    featured: true,
    colors: ['#ffffff'],
    sizes: shoeSizes(),
    images: [LOCAL.shoe3, LOCAL.shoe3],
    description: 'Clean triple-white low lifestyle sneaker.',
  },
  {
    name: 'UNKNOWN Teal Low',
    category: 'shoes',
    price: 14990,
    colors: ['#0b4f54', '#f3ebe0'],
    sizes: shoeSizes(5),
    images: [LOCAL.shoe4, LOCAL.shoe4],
    description: 'Low court sneaker in teal suede over sail leather.',
  },
  {
    name: 'UNKNOWN Royal High',
    category: 'shoes',
    price: 17990,
    colors: ['#1e3a8a', '#ffffff', '#0a0a0a'],
    sizes: shoeSizes(),
    images: [LOCAL.shoe5, LOCAL.shoe5],
    description: 'Royal blue and black high-top with white midsole.',
  },
  {
    name: 'UNKNOWN Samba Classic',
    category: 'shoes',
    price: 10990,
    colors: ['#ffffff', '#0a0a0a', '#8b6b45'],
    sizes: shoeSizes(7),
    images: [LOCAL.shoe6, LOCAL.shoe6],
    description: 'White leather indoor classic with gum sole and black stripes.',
  },
  {
    name: 'UNKNOWN Bred Toe',
    category: 'shoes',
    price: 18490,
    colors: ['#0a0a0a', '#c8102e', '#ffffff'],
    sizes: shoeSizes(),
    images: [LOCAL.shoe7, LOCAL.shoe7],
    description: 'Black-toe high-top with red swoosh and collar.',
  },
  {
    name: 'UNKNOWN Bounce Run',
    category: 'shoes',
    price: 13490,
    colors: ['#111111', '#b87333'],
    sizes: shoeSizes(6),
    images: [LOCAL.shoe8, LOCAL.shoe8],
    description: 'Black bounce runner with bronze heel counter.',
  },
  {
    name: 'UNKNOWN Black Wide Draw',
    category: 'trousers',
    price: 6490,
    featured: true,
    colors: ['#0a0a0a', '#ffffff'],
    sizes: apparelSizes(18),
    images: [LOCAL.trouser4Front, LOCAL.trouser4Back],
    description: 'Matte black wide-leg drawstring trouser — hang-rail essential.',
  },
  {
    name: 'UNKNOWN Cream Linen',
    category: 'trousers',
    price: 6890,
    featured: true,
    colors: ['#f3ebe0', '#c4b59a'],
    sizes: apparelSizes(16),
    images: [LOCAL.trouser5Front, LOCAL.trouser5Back],
    description: 'Cream linen wide-leg with soft natural drape.',
  },
  {
    name: 'UNKNOWN Charcoal Pleat',
    category: 'trousers',
    price: 6790,
    featured: true,
    colors: ['#4a4a4a', '#2a2a2a'],
    sizes: apparelSizes(16),
    images: [LOCAL.trouser6Front, LOCAL.trouser6Back],
    description: 'Charcoal wide-leg with pressed center crease.',
  },
  {
    name: 'UNKNOWN Navy Tailor',
    category: 'trousers',
    price: 6990,
    featured: false,
    colors: ['#1e3a5f', '#0a0a0a'],
    sizes: apparelSizes(14),
    images: [LOCAL.trouser7Front, LOCAL.trouser7Back],
    description: 'Navy tailored trouser with clean crease.',
  },
  {
    name: 'UNKNOWN Khaki Chino',
    category: 'trousers',
    price: 6590,
    featured: false,
    colors: ['#c4b59a', '#6b5344'],
    sizes: apparelSizes(16),
    images: [LOCAL.trouser8Front, LOCAL.trouser8Back],
    description: 'Classic khaki chino, straight everyday cut.',
  },
  {
    name: 'UNKNOWN Espresso Wide',
    category: 'trousers',
    price: 6690,
    featured: false,
    colors: ['#3b2a22', '#6b5344'],
    sizes: apparelSizes(14),
    images: [LOCAL.trouser9Front, LOCAL.trouser9Back],
    description: 'Espresso brown wide-leg with soft modern drape.',
  },
  {
    name: 'UNKNOWN Core Tee',
    category: 't-shirts',
    price: 2490,
    featured: true,
    colors: ['#ffffff', '#000000', '#525252'],
    sizes: apparelSizes(30),
    images: [IMG.tee1, IMG.tee2],
    description: 'Heavyweight cotton tee with boxy fit and tonal UNKNOWN mark.',
  },
  {
    name: 'UNKNOWN Strike Tee',
    category: 't-shirts',
    price: 2790,
    featured: true,
    colors: ['#111111', '#22c55e'],
    sizes: apparelSizes(18),
    images: [IMG.tee3, IMG.tee1],
    description: 'Graphic strike tee with oversized print and washed finish.',
  },
  {
    name: 'UNKNOWN Soft Rib Tee',
    category: 't-shirts',
    price: 2690,
    colors: ['#d6d3d1', '#78716c'],
    sizes: apparelSizes(),
    images: [IMG.tee4, IMG.tee2],
    description: 'Ribbed cotton tee with soft hand-feel and clean neckline.',
  },
  {
    name: 'UNKNOWN Black Puffer',
    category: 'jackets',
    price: 12990,
    featured: true,
    colors: ['#0a0a0a', '#222222'],
    sizes: apparelSizes(8),
    images: [LOCAL.jacket4Front, LOCAL.jacket4Back],
    description: 'Gloss black insulated puffer with funnel collar — clean hang.',
  },
  {
    name: 'UNKNOWN Night Varsity',
    category: 'jackets',
    price: 10990,
    featured: true,
    colors: ['#0a0a0a', '#ffffff'],
    sizes: apparelSizes(10),
    images: [LOCAL.jacket5Front, LOCAL.jacket5Back],
    description: 'Matte black varsity with white-stripe rib collar and cuffs.',
  },
  {
    name: 'UNKNOWN Goldline Leather',
    category: 'jackets',
    price: 14990,
    featured: true,
    colors: ['#0a0a0a', '#e8c547'],
    sizes: apparelSizes(7),
    images: [LOCAL.jacket6Front, LOCAL.jacket6Back],
    description: 'Black leather biker with mustard collar lining flash.',
  },
  {
    name: 'UNKNOWN Olive Field',
    category: 'jackets',
    price: 11990,
    featured: false,
    colors: ['#556b2f', '#2a2018'],
    sizes: apparelSizes(8),
    images: [LOCAL.jacket7Front, LOCAL.jacket7Back],
    description: 'Olive field jacket with four flap pockets.',
  },
  {
    name: 'UNKNOWN Cream Coach',
    category: 'jackets',
    price: 9990,
    featured: false,
    colors: ['#f3ebe0', '#0a0a0a'],
    sizes: apparelSizes(10),
    images: [LOCAL.jacket8Front, LOCAL.jacket8Back],
    description: 'Cream oversized coach jacket with snap front.',
  },
  {
    name: 'UNKNOWN Indigo Trucker',
    category: 'jackets',
    price: 11490,
    featured: false,
    colors: ['#3b6ea5', '#1e3a5f'],
    sizes: apparelSizes(9),
    images: [LOCAL.jacket9Front, LOCAL.jacket9Back],
    description: 'Classic indigo denim trucker with chest pockets.',
  },
  {
    name: 'UNKNOWN Pink R Hoodie',
    category: 'hoodies',
    price: 6990,
    featured: true,
    colors: ['#0a0a0a', '#ff2d6a'],
    sizes: apparelSizes(16),
    images: [LOCAL.hoodie1Front, LOCAL.hoodie1Back],
    description: 'Black heavyweight hoodie with pink R mark — front and back hit.',
  },
  {
    name: 'UNKNOWN Unexplored Hoodie',
    category: 'hoodies',
    price: 6790,
    featured: true,
    colors: ['#6b1e2e', '#8b2e3e'],
    sizes: apparelSizes(),
    images: [LOCAL.hoodie2Front, LOCAL.hoodie2Back],
    description: 'Maroon pullover with Unexplored Dimensions chest print.',
  },
  {
    name: 'UNKNOWN Sail Hoodie',
    category: 'hoodies',
    price: 6890,
    featured: true,
    colors: ['#9ec9e0', '#1a1a1a'],
    sizes: apparelSizes(),
    images: [LOCAL.hoodie3Front, LOCAL.hoodie3Back],
    description: 'Sky-blue fleece with folk sail graphic on the chest.',
  },
  {
    name: 'UNKNOWN Furioso Hoodie',
    category: 'hoodies',
    price: 7190,
    colors: ['#f5f0e8', '#0a0a0a'],
    sizes: apparelSizes(11),
    images: [LOCAL.hoodie4Front, LOCAL.hoodie4Back],
    description: 'Cream oversized hoodie with Furioso urban back graphic.',
  },
];

const seed = async () => {
  try {
    await connectDB();

    // FK order: items → carts/orders → products/users
    await Order.deleteMany();
    await Cart.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminUser = await User.create({
      name: 'UNKNOWN Admin',
      email: 'admin@unknown.com',
      password: adminPassword,
      role: 'admin',
    });
    const demoUser = await User.create({
      name: 'Demo Shopper',
      email: 'demo@unknown.com',
      password: 'Demo123!',
      role: 'user',
    });

    const inserted = await Product.insertMany(products);
    const pick = (i) => inserted[i % inserted.length];

    const sampleCustomers = [
      { fullName: 'Oliver John Brown', phone: '03001234567', email: 'oliver@example.com', city: 'Lahore' },
      { fullName: 'Amina Khan', phone: '03017654321', email: 'amina@example.com', city: 'Karachi' },
      { fullName: 'Noah Ali', phone: '03331239876', email: 'noah@example.com', city: 'Islamabad' },
      { fullName: 'Sara Malik', phone: '03219876543', email: 'sara@example.com', city: 'Lahore' },
      { fullName: 'Guest Walker', phone: '03451230000', email: 'guest.walker@mail.com', city: 'Faisalabad' },
      { fullName: 'Hassan Raza', phone: '03115550909', email: 'hassan@example.com', city: 'Multan' },
    ];

    const statuses = ['pending', 'processing', 'completed', 'pending', 'processing', 'completed', 'shipped', 'delivered'];
    const now = new Date();

    const sampleOrders = sampleCustomers.map((customer, index) => {
      const productA = pick(index);
      const productB = pick(index + 3);
      const sizeA = productA.sizes?.[0]?.size || 'M';
      const sizeB = productB.sizes?.[0]?.size || 'M';
      const qtyA = 1 + (index % 2);
      const items = [
        {
          product: productA._id,
          name: productA.name,
          size: sizeA,
          quantity: qtyA,
          price: productA.price,
          image: productA.images[0],
          category: productA.category,
        },
      ];
      if (index % 2 === 0) {
        items.push({
          product: productB._id,
          name: productB.name,
          size: sizeB,
          quantity: 1,
          price: productB.price,
          image: productB.images[0],
          category: productB.category,
        });
      }
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const createdAt = new Date(now);
      createdAt.setDate(now.getDate() - index * 3);
      createdAt.setMonth(now.getMonth() - (index % 5));

      const isGuest = index === 4;
      return {
        user: isGuest ? null : (index % 2 === 0 ? demoUser._id : adminUser._id),
        isGuest,
        items,
        shippingAddress: {
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          address: `${12 + index} Market Street`,
          city: customer.city,
          postalCode: `5400${index}`,
          country: 'Pakistan',
        },
        paymentMethod: index % 3 === 0 ? 'card' : 'cod',
        paymentStatus: 'pending',
        orderStatus: statuses[index % statuses.length],
        totalAmount,
        createdAt,
        updatedAt: createdAt,
      };
    });

    // Spread a few extra orders across months for the revenue chart
    for (let m = 0; m < 10; m += 1) {
      const product = pick(m + 2);
      const size = product.sizes?.[0]?.size || 'M';
      const createdAt = new Date(now.getFullYear(), m, 8 + (m % 7));
      sampleOrders.push({
        user: demoUser._id,
        isGuest: false,
        items: [
          {
            product: product._id,
            name: product.name,
            size,
            quantity: 1 + (m % 3),
            price: product.price,
            image: product.images[0],
            category: product.category,
          },
        ],
        shippingAddress: {
          fullName: sampleCustomers[m % sampleCustomers.length].fullName,
          phone: sampleCustomers[m % sampleCustomers.length].phone,
          email: sampleCustomers[m % sampleCustomers.length].email,
          address: `${20 + m} Studio Lane`,
          city: sampleCustomers[m % sampleCustomers.length].city,
          postalCode: `5500${m}`,
          country: 'Pakistan',
        },
        paymentMethod: 'cod',
        paymentStatus: m % 7 === 0 ? 'refunded' : 'paid',
        orderStatus: m % 7 === 0 ? 'cancelled' : 'completed',
        totalAmount: product.price * (1 + (m % 3)),
        createdAt,
        updatedAt: createdAt,
      });
    }

    await Order.insertMany(sampleOrders);

    console.log(
      `Seeded ${products.length} products, ${sampleOrders.length} sample orders + admin/demo users`
    );
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
