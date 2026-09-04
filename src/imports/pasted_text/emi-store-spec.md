Build a full-stack web application called "EMI Store" — a product catalog with 
mutual-fund-backed EMI plans, similar to Snapmint's product pages.

## TECH STACK
- Frontend: React (Vite), Tailwind CSS, React Router
- Backend: Node.js + Express
- Database: PostgreSQL (use Prisma ORM for schema + migrations + seeding)
- Deployment target: Vercel (frontend) + Render (backend + DB)

## DATA MODEL
Design and implement these tables/models:
1. Product: id, slug (unique, e.g. "iphone-17-pro"), name, brand, category, description
2. Variant: id, product_id (FK), variant_name (e.g. "256GB Silver"), mrp, price, 
   image_url, stock_status, color, storage
3. EMIPlan: id, variant_id (FK), monthly_amount, tenure_months, interest_rate, 
   cashback_amount, is_recommended (boolean)

Write a seed script that populates:
- At least 3 products (e.g. iPhone 17 Pro, Samsung Galaxy S24 Ultra, OnePlus 12)
- Each product with 2+ variants (storage/color combinations)
- Each variant with 5-7 EMI plans across different tenures (3, 6, 12, 24, 36, 48, 
  60 months), with 0% interest for shorter tenures and ~10.5% for longer ones, 
  matching realistic EMI math (monthly_amount * tenure ≈ price, plus interest for 
  higher tenures), and cashback on select plans.

## BACKEND REQUIREMENTS
Build REST APIs:
- GET /api/products — list all products with their default/lowest-price variant, 
  name, brand, thumbnail image, starting price
- GET /api/products/:slug — full product detail: all variants, and for the 
  selected/default variant, all EMI plans
- GET /api/products/:slug/variants/:variantId/emi-plans — EMI plans for a specific 
  variant (used when user switches variant on frontend)
- POST /api/orders — accepts { variantId, emiPlanId } and creates a mock order 
  record (id, status: "pending"), returns order confirmation — this powers the 
  "Proceed" button
- Add input validation and proper error responses (404 for unknown slug, 400 for 
  bad input)
- Add CORS config so the deployed frontend can call this API
- No hardcoded data anywhere in route handlers — everything comes from the DB

## FRONTEND REQUIREMENTS
- Home page (/) — grid of product cards (image, name, starting price, "View EMI 
  options" link), data fetched from /api/products
- Product detail page (/products/:slug) — matching the reference layout:
  - Left: product image, name, variant selector (storage/color swatches or 
    dropdown), "Available in N finishes"
  - Right: current price with MRP struck through, list of EMI plan cards each 
    showing monthly amount, tenure, interest rate, cashback badge if applicable
  - EMI plans must be selectable (radio-button behavior, one active at a time, 
    clear visual selected state)
  - "Proceed" button — disabled until a plan is selected, calls POST /api/orders 
    on click, shows a success confirmation (toast or inline message) with the 
    chosen plan summary
  - Switching variants should refetch/update the EMI plan list without a full 
    page reload
- Fully responsive: mobile single-column, desktop two-column layout as in the 
  reference image
- Loading and error states for all API calls (skeleton or spinner, and a 
  friendly error message if the fetch fails)
- Use Tailwind for styling; keep design clean and close to the reference image 
  (white cards, subtle shadows, green cashback text, red strikethrough MRP)

## ADDITIONAL FEATURES (nice-to-haves, implement if time allows)
- Simple search/filter bar on the home page (by product name or brand)
- "Recommended" badge on the best-value EMI plan (lowest total interest paid)
- Basic EMI calculator display: show total payable amount and total interest for 
  the selected plan
- Sort products by price on the home page
- A minimal admin-free way to add a product via a seed/JSON file (documented in 
  README) so the catalog is easy to extend without a DB GUI
- Unit tests for at least the EMI-plan and product API endpoints (Jest + 
  Supertest)
- Basic rate limiting / helmet middleware on the Express app for production hygiene

## PROJECT STRUCTURE
Organize as a monorepo or two folders: /backend and /frontend, each with their 
own package.json. Include a root README.md.

## DELIVERABLES TO PRODUCE
1. Complete, runnable codebase (backend + frontend + Prisma schema + seed script)
2. README.md containing:
   - Setup and run instructions (local dev, env vars needed, how to run migrations 
     + seed)
   - All API endpoints with example request/response JSON
   - Tech stack used
   - Database schema (table diagram or Prisma schema excerpt)
   - Notes on the additional features implemented
3. .env.example file listing required environment variables
4. Deployment-ready config (e.g. render.yaml or vercel.json / build scripts) so 
   the app can be deployed to Vercel (frontend) and Render (backend + Postgres) 
   with minimal manual steps

Build this step by step: schema → seed → backend routes (test with curl) → 
frontend pages → styling → additional features → README. Show me the file 
structure first before writing code.