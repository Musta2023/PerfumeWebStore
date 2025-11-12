# Changelog

## [Unreleased]

### Changed
- Home page categories now use fragrance families to match backend categories:
  Floral, Woody, Citrus, Oriental, Fresh, Fruity, Spicy, Gourmand, Aquatic.
- Category page treats 404 from `/api/products/category/:name` as an empty list:
  shows a friendly "No products found" state with a Back to Home CTA (no error toast).
- Cart UX while logged out: 401 responses from cart endpoints do not show error toasts; client-side cart is cleared.

### Added
- Shared `CATEGORIES` constant in `frontend/src/constants/categories.js`.
- Home “Featured” section wired to `/api/products/featured` and `/featured` page to see all featured products.
- Seeding script `npm run seed:products` to populate demo perfumes across categories (some marked featured).

### Notes
- Non-404 errors (e.g., 5xx, network) on Category page still display an error state/toast.
- Logged-in cart flows remain unchanged.
