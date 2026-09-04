# EMI 1Fi Store

A React + Vite smartphone store with mutual-fund-backed EMI plans, product variants, and a Node.js product API backed by LowDB.

## Features

- Product catalog loaded from a backend API
- Three products with multiple color and storage variants
- EMI plans and cashback information per product variant
- Unique product URLs such as `/products/iphone-17-pro`
- UPI, card, net banking, and mutual fund payment flows
- Alternate mobile number OTP flow
- Camera QR scanner for UPI payments when supported by the browser
- Responsive dark and light themes
- Shared footer and navigation across all pages

## Technology

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React hooks and Context API

### Backend

- Node.js native HTTP server
- LowDB 7 JSON NoSQL database
- JSON product and EMI plan documents

## Project Structure

```text
.
├── server/
│   ├── index.mjs              # Backend API server
│   └── data/
│       ├── products.json      # Initial database seed
│       └── store-db.json      # Persisted LowDB database
├── src/
│   ├── App.tsx                # Frontend pages, routing, and payment flow
│   ├── index.css              # Global styles and theme variables
│   └── main.tsx               # React entry point
├── docs/
│   └── database-schema.md     # Database schema documentation
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Requirements

- Node.js 20 or newer
- pnpm

Install dependencies:

```bash
pnpm install
```

## Run The Application

Start the frontend and backend together:

```bash
pnpm dev:full
```

The frontend runs at:

```text
http://localhost:8443
```

The API runs at:

```text
http://localhost:3001
```

You can also start each process separately:

```bash
pnpm dev    # Vite frontend
pnpm api    # LowDB API
```

## API Endpoints

### List products

```http
GET /api/products
```

### Get a product

```http
GET /api/products/:slug
```

Example:

```text
/api/products/iphone-17-pro
```

### Get EMI plans

```http
GET /api/products/:slug/emi-plans
```

Example:

```text
/api/products/iphone-17-pro/emi-plans
```

## Frontend URLs

- `/`
- `/products`
- `/products/iphone-17-pro`
- `/products/samsung-s24-ultra`
- `/products/oneplus-12`
- `/how-it-works`
- `/support`
- `/payment`

## Database

The backend uses LowDB with a JSON file adapter. On startup, `server/index.mjs` loads the seed structure from `server/data/products.json`, opens `server/data/store-db.json`, and persists the database file if needed.

The schema is documented in [docs/database-schema.md](docs/database-schema.md).

## Validation Commands

Build the frontend:

```bash
pnpm run build
```

Format source files:

```bash
pnpm run format
```

Check the API manually:

```bash
curl http://localhost:3001/api/products
curl http://localhost:3001/api/products/iphone-17-pro
curl http://localhost:3001/api/products/iphone-17-pro/emi-plans
```

## Demo Payment Notice

The payment, SMS OTP, and QR scanner flows are frontend demonstrations. No real payment gateway, bank connection, SMS provider, or financial transaction is performed.
