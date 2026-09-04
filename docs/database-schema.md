# Database Schema

The application uses LowDB 7 with a JSON file adapter. The database is stored at `server/data/store-db.json` and is initialized from `server/data/products.json` when the API starts.

## Root Document

```json
{
  "products": [Product]
}
```

## Product

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `slug` | string | yes | Unique URL-safe identifier, for example `iphone-17-pro` |
| `name` | string | yes | Display name |
| `brand` | string | yes | Manufacturer name |
| `category` | string | yes | Product category |
| `badge` | string | yes | Marketing badge such as `NEW` or `DEAL` |
| `badgeColor` | string | yes | CSS color used for the badge |
| `description` | string | yes | Product description |
| `accentColor` | string | yes | Product theme color |
| `features` | string[] | yes | Key product features |
| `variants` | Variant[] | yes | Available color and storage combinations |
| `emiPlans` | object | yes | EMI plans grouped by variant ID |

## Variant

Each product has two or more variants. A variant represents a purchasable color, finish, or storage option.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique variant ID within the product |
| `name` | string | yes | Full variant label |
| `color` | string | yes | Color value used by the UI |
| `colorLabel` | string | yes | Human-readable color name |
| `storage` | string | yes | Storage option such as `256GB` |
| `mrp` | number | yes | Maximum retail price in INR |
| `price` | number | yes | Current selling price in INR |
| `stock` | boolean | yes | Whether the variant is available |
| `image` | string | yes | Product image URL |

## EMI Plans

`emiPlans` is an object whose keys match variant IDs. Each key contains an array of EMI plans for that variant.

```json
{
  "emiPlans": {
    "v1": [EmiPlan]
  }
}
```

### EmiPlan

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique EMI plan ID |
| `months` | number | yes | Repayment duration |
| `monthly` | number | yes | Monthly payment in INR |
| `interest` | number | yes | Annual interest percentage |
| `cashback` | number | yes | Cashback amount in INR |
| `recommended` | boolean | yes | Whether the UI highlights this plan |

## Example

```json
{
  "products": [
    {
      "slug": "iphone-17-pro",
      "name": "iPhone 17 Pro",
      "brand": "Apple",
      "category": "Smartphones",
      "badge": "NEW",
      "badgeColor": "#a855f7",
      "accentColor": "#7c3aed",
      "features": ["A19 Pro Chip", "48MP Camera System"],
      "variants": [
        {
          "id": "v1",
          "name": "256GB Natural Titanium",
          "color": "#c8beb4",
          "colorLabel": "Natural Titanium",
          "storage": "256GB",
          "mrp": 134900,
          "price": 127400,
          "stock": true,
          "image": "https://example.com/iphone.jpg"
        }
      ],
      "emiPlans": {
        "v1": [
          {
            "id": "e1",
            "months": 12,
            "monthly": 11242,
            "interest": 0,
            "cashback": 7500,
            "recommended": true
          }
        ]
      }
    }
  ]
}
```

## API Mapping

- `GET /api/products` returns the `products` array.
- `GET /api/products/:slug` returns one `Product` document.
- `GET /api/products/:slug/emi-plans` returns the selected product's `emiPlans` object.

The API returns HTTP `404` with an error object when a requested product slug does not exist.
