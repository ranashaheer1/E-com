# UNKNOWN — Clothing E-Commerce

Full-stack luxury streetwear store inspired by Outfitters / the reference “Websites in 2026” rack interaction.

## Stack

- **Frontend:** Next.js 14, Tailwind CSS, Framer Motion, Shadcn-style Radix UI
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT
- **Images:** Unsplash CDN (Cloudinary-ready via env)

## Project structure

```
E-com/
  backend/     Express REST API
  frontend/    Next.js storefront
```

## Setup

### 1. MongoDB

Start MongoDB locally (default `mongodb://127.0.0.1:27017`).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000`

Demo users after seed:

- Admin: `admin@unknown.com` / `Admin123!`
- Shopper: `demo@unknown.com` / `Demo123!`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Store: `http://localhost:3000`

## Features

- Interactive clothing-rack hero (mouse-follow focus)
- Category grids: shirts, pants, cargo, trousers, t-shirts, jackets, hoodies
- Premium wall-shelf shoes section
- Product detail with gallery, sizes, add to cart
- JWT auth, cart, checkout, orders
- Admin product/order APIs under `/api/admin`

## Cloudinary

Add credentials to `backend/.env`:

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Product `images` can then point at Cloudinary URLs.
