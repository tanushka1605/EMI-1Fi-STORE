import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { JSONFilePreset } from "lowdb/node";

const root = path.dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(path.join(root, "data", "products.json"), "utf8"));
const db = await JSONFilePreset(path.join(root, "data", "store-db.json"), seed);
await db.write();
const port = Number(process.env.API_PORT || 3001);

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function route(req) {
  return new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;
}

const server = createServer((req, res) => {
  const pathname = route(req);
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    res.end();
    return;
  }

  if (req.method === "GET" && pathname === "/api/products") {
    sendJson(res, 200, db.data.products);
    return;
  }

  const productMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
  if (req.method === "GET" && productMatch) {
    const product = db.data.products.find(item => item.slug === decodeURIComponent(productMatch[1]));
    sendJson(res, product ? 200 : 404, product || { error: "Product not found" });
    return;
  }

  const emiMatch = pathname.match(/^\/api\/products\/([^/]+)\/emi-plans$/);
  if (req.method === "GET" && emiMatch) {
    const product = db.data.products.find(item => item.slug === decodeURIComponent(emiMatch[1]));
    sendJson(res, product ? 200 : 404, product ? product.emiPlans : { error: "Product not found" });
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Store API listening on http://localhost:${port}`);
});
