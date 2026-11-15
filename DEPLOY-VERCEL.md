# UNKNOWN — live on Vercel only (one project)

Frontend + API ab **ek hi Next.js app** mein hain.  
Tumhein **alag backend deploy nahi** karna.

Jo tumhare bina main nahi kar sakta: **free MySQL cloud account** (login tumhara hona zaroori hai).  
Baaki sab ready hai.

---

## 1) Free MySQL (2–3 minute) — Railway example

1. Open https://railway.app → login (GitHub)
2. **New Project** → **Add MySQL**
3. MySQL service → **Variables** / **Connect** → copy **`MYSQL_URL`** or **`DATABASE_URL`**  
   (form: `mysql://user:pass@host:port/railway`)
4. Optional: in Railway shell / local, run seed once (step 3)

Same idea on **Aiven**, **PlanetScale**, or **FreeSQLDatabase** — koi bhi hosted MySQL.

---

## 2) Vercel deploy

1. https://vercel.com → **Add New Project** → import `ranashaheer1/E-com`
2. **Root Directory** = `frontend`  ← important
3. Framework = Next.js (auto)
4. **Environment Variables** add:

| Name | Value |
|------|--------|
| `DATABASE_URL` | paste Railway MySQL URL |
| `JWT_SECRET` | koi lamba random secret |
| `ADMIN_PASSWORD` | `Admin123!` (ya apna) |
| `FRONTEND_URL` | `https://YOUR-APP.vercel.app` |
| `MYSQL_SSL` | leave empty (SSL on by default for URL) |

**Do NOT set** `NEXT_PUBLIC_API_URL` (browser same site `/api` use karega).

5. Deploy

---

## 3) Seed products (once)

Locally (MySQL URL ke sath):

```bash
cd frontend
# temporary: set DATABASE_URL in .env.local to the SAME cloud URL
npm run seed
```

Ya Railway MySQL pe connected machine se:

```bash
cd frontend
set DATABASE_URL=mysql://...
npm run seed
```

---

## 4) Check

- `https://YOUR-APP.vercel.app/api/health` → `{ success: true }`
- `https://YOUR-APP.vercel.app/api/products?limit=3` → products JSON
- Open store + Full Fit

---

## Local dev (optional)

1. Start local MySQL (`backend/scripts/start-mysql-local.ps1` or your MySQL)
2. `cd frontend && npm run dev`  
   → site + API both on `http://localhost:3000`

Separate `backend` folder ab optional hai (local Express 5000); live ke liye zaroori nahi.
