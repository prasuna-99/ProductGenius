# ProductGenius backend (Express + Prisma + Postgres)

Serves the React storefront in `../src`. Frontend stays untouched — it will call this API instead of `localStorage`.

## Setup

```powershell
cd server
npm install
Copy-Item .env.example .env   # then edit DATABASE_URL + JWT_SECRET
# start Postgres (docker):
# docker run --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=productgenius -p 5432:5432 -d postgres:16
npm run db:push               # create tables (or: npm run db:migrate)
npm run seed                  # demo users (customer/sellers/admin, password: demo1234)
npm run dev                   # http://localhost:5000  (health: /health)
```

React dev server keeps running on `:3000` — point its fetches at `http://localhost:5000/api`.

## Endpoints (Postman collection path = `/api`)

| Method | Path | Auth | What |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{name,email,password,role,storeName?}` → JWT |
| POST | `/api/auth/login` | — | `{email,password}` → JWT + user |
| GET | `/api/products?sellerId=&category=` | — | catalog (public storefront) |
| POST | `/api/products` | seller | creates listing; server sets `sellerId` + `canonicalId` |
| PATCH/DELETE | `/api/products/:id` | owner/admin | owner-only guard |
| POST | `/api/orders` | customer | `{items:[{productId,quantity}], shippingAddress, discountCode?}`; stamps seller/canonical, atomic stock decrement, per-seller `sellerStatus` init |
| GET | `/api/orders/mine` | any | customer: own orders; seller: only orders containing own lines (items filtered); admin: all |
| PATCH | `/api/orders/:id/status` | seller/admin/customer | seller body `{status}` updates OWN share only; global Delivered only when ALL sellers delivered → ingests dataset once |
| GET | `/api/mining/rules?minSupport&minConfidence` | — | cached rules, recomputed on ingest |
| GET | `/api/mining/recommend?cart=a,b` | — | pair suggestions for listing IDs |
| POST | `/api/mining/recompute` | admin | force re-mine |
| GET/POST | `/api/products/:id/reviews` | GET —; POST customer | POST rejected unless caller has a Delivered order with that product; recomputes average |
| GET | `/api/dataset/transactions` | admin | raw rows for the Admin table |
| POST | `/api/dataset/import` | admin | `{text: "T0001 | Soap, ..."}` raw-text import (same token map as frontend) |
| GET/POST | `/api/campaigns`, PATCH/DELETE | admin writes | campaigns |
| POST | `/api/categories/requests` | seller | request a category |
| POST | `/api/categories/requests/:id/approve` | admin | atomic: create category + flip request (single Prisma transaction) |
| GET | `/api/categories` | — | global usable categories |

Photos (product/campaign/review): upload client-side to Cloudinary, send back the URL (same pattern the React app already uses with compressed dataURLs).
