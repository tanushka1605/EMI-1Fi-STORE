# 1Fi EMI Store – Full Stack EMI Product Catalog

## Deployed link - https://emi-store-1fi.vercel.app/

## Overview

1Fi EMI Store is a full-stack fintech web application that enables users to explore premium smartphones and purchase them through flexible EMI plans backed by mutual fund-based financial solutions.

The platform dynamically retrieves product information, variants, pricing, images, and EMI plans from a backend API connected to a database and presents them through a modern, responsive React interface.

A React + Vite smartphone store with mutual-fund-backed EMI plans, product variants, and a Node.js product API backed by LowDB.

## Features

- Dynamic product catalog loaded from backend APIs
- Product-specific URLs
- Multiple storage and color variants
- EMI plan comparison and selection
- Monthly installment calculation
- Cashback information
- UPI, Card, and Net Banking payment flow simulation
- Responsive mobile-first design
- Dark and Light theme support
- Real-time API-driven product rendering
- Database-backed storage using LowDB

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Hooks
- Context API

### Backend

- Node.js
- Native HTTP Server

### Database

- LowDB 7 (JSON Database)

### Tools

- PNPM
- Concurrently
- Git
- GitHub
- VS Code

## Project Structure

```text
EMI-Store-1Fi/
│
├── src/
│   ├── imports/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
│
├── server/
│   ├── index.mjs
│   └── data/
│       ├── products.json
│       └── store-db.json
│
├── docs/
│   └── database-schema.md
│
├── public/
├── dist/
│
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── render.yaml
├── README.md
└── .gitignore

```

---

# Installation & Setup

## Prerequisites

- Node.js 20+
- PNPM

---

## Clone Repository

```bash
git clone https://github.com/tanushka1605/EMI-Store-1Fi.git
cd EMI-Store-1Fi
```

---

## Install Dependencies

```bash
pnpm install
```

---

## Run Frontend & Backend Together

```bash
pnpm dev:full
```

Frontend:

```text
http://localhost:8443
```

Backend API:

```text
http://localhost:3001
```

---

## Run Separately

### Backend

```bash
pnpm api
```

### Frontend

```bash
pnpm dev
```

---

# API Endpoints

## Get All Products

```http
GET /api/products
```

### Example Response

```json
[
  {
    "slug": "iphone-17-pro",
    "name": "iPhone 17 Pro",
    "brand": "Apple"
  }
]
```

---

## Get Product By Slug

```http
GET /api/products/:slug
```

### Example

```http
GET /api/products/iphone-17-pro
```

### Example Response

```json
{
  "slug": "iphone-17-pro",
  "name": "iPhone 17 Pro",
  "brand": "Apple"
}
```

---

## Get EMI Plans

```http
GET /api/products/:slug/emi-plans
```

### Example

```http
GET /api/products/iphone-17-pro/emi-plans
```

### Example Response

```json
{
  "v1": [
    {
      "months": 12,
      "monthly": 11242,
      "interest": 0,
      "cashback": 7500
    }
  ]
}
```

---

# Frontend Routes

```text
/
├── /products
├── /products/iphone-17-pro
├── /products/samsung-s24-ultra
├── /products/oneplus-12
├── /how-it-works
├── /support
└── /payment
```

---

# Database Schema

The application uses **LowDB** as a lightweight JSON database.

## Product Schema

```json
{
  "slug": "string",
  "name": "string",
  "brand": "string",
  "category": "string",
  "badge": "string",
  "description": "string",
  "features": [],
  "variants": [],
  "emiPlans": {}
}
```

### Variant Schema

```json
{
  "id": "string",
  "name": "string",
  "color": "string",
  "colorLabel": "string",
  "storage": "string",
  "mrp": "number",
  "price": "number",
  "stock": "boolean",
  "image": "string"
}
```

### EMI Plan Schema

```json
{
  "id": "string",
  "months": "number",
  "monthly": "number",
  "interest": "number",
  "cashback": "number",
  "recommended": "boolean"
}
```

---

# Seed Data

Seed data is stored in:

```text
server/data/products.json
```

Database file:

```text
server/data/store-db.json
```

Example:

```json
{
  "slug": "iphone-17-pro",
  "name": "iPhone 17 Pro",
  "brand": "Apple",
  "variants": [
    {
      "storage": "256GB",
      "color": "Natural Titanium",
      "price": 134900
    }
  ]
}
```

---

# Products Included

### Apple

- iPhone 17 Pro
- Multiple storage variants
- Multiple color variants

### Samsung

- Samsung Galaxy S24 Ultra
- Multiple storage variants
- Multiple color variants

### OnePlus

- OnePlus 12
- Multiple storage variants
- Multiple color variants

---

# Deployment

## Backend Deployment (Render)

Deploy the backend using the included `render.yaml`.

Backend URL example:

```text
https://emi-store-api.onrender.com
```

## Frontend Deployment (Vercel)

Set environment variable:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

Then redeploy the frontend.

---

# Validation Commands

Build project:

```bash
pnpm run build
```

Check API:

```bash
curl http://localhost:3001/api/products

curl http://localhost:3001/api/products/iphone-17-pro

curl http://localhost:3001/api/products/iphone-17-pro/emi-plans
```

---

# Assignment Requirements Covered

✅ Dynamic Product Data from Backend API

✅ Product-Specific URLs

✅ Multiple Product Variants

✅ Database-Backed Storage

✅ EMI Plan Selection

✅ REST API Integration

✅ Responsive UI

✅ GitHub Repository

✅ Database Schema

✅ Seed Data


# Author

**Tanushka Tomar**

B.Tech – Artificial Intelligence & Machine Learning  
ITM University, Gwalior

GitHub: https://github.com/tanushka1605
