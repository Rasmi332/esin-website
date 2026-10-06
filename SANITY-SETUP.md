# ESIN-test: Sanity product integration

This folder remains a plain static website. No build, SDK, API token, backend, or framework is required.

## Existing grid and changes

- `index.html`: original home product grid (`data-products="all"`).
- `urunler.html`: original catalogue grid (`#catalogue-grid`), filters and search.
- `js/products.js`: unchanged local product data used as a fallback.
- `js/site.js`: existing card renderer, filters, and reusable detail renderer. It now loads the Sanity adapter on the home/catalogue pages and Sanity product detail links, reuses exactly the same card elements/classes, and puts the real price in the existing price paragraph.
- `js/sanity-products.js`: new browser fetch and normalization adapter.
- `urun-detay.html?urun=YOUR-SLUG&source=sanity`: existing reusable page for new Sanity products, with name/category/price/main image. Full descriptions, galleries, materials and collections are outside this first integration.

All HTML, CSS, assets and local product data are unchanged. The Mira collection and the old dedicated `urunler/*.html` pages continue using local products for now. No products are written to Sanity.

## Manual Sanity configuration

1. Open https://www.sanity.io/manage and select project `p1o6t3yx`.
2. Under **API → CORS origins**, add the exact origin used to preview this website, for example `http://localhost:5500`. If you use `http://127.0.0.1:5500`, add that separately. Scheme, hostname and port must match; do not include a page path.
3. Leave **Allow credentials** OFF. This connection makes anonymous, read-only requests.
4. Under **Datasets**, check that `production` is **Public**. Anonymous browser reads require a public dataset. Public means all published documents in that dataset can be queried, not just the products selected by this website. If the dataset must stay private, this token-free browser-only approach cannot read it; do not put an API token in frontend JavaScript.
5. Later, add the exact HTTPS origin of the deployed test website to CORS as well.

References: [Sanity CORS](https://www.sanity.io/docs/content-lake/cors), [Query API](https://www.sanity.io/docs/http-reference/query).

## Test locally

1. Open **this ESIN-test folder** in your editor. Start a static preview, such as VS Code Live Server, on port **5500**. Alternatively, if Python is installed, run `py -m http.server 5500 --bind 127.0.0.1` from this folder. The server only serves files; all Sanity fetching runs in the browser.
2. Visit `http://localhost:5500/urunler.html` (or the exact 127.0.0.1 origin configured above). Do not double-click the HTML as `file://`; browser module/CORS restrictions will cause fallback.
3. In your existing Sanity Studio create an **Ürünler** document. Enter a name, generate its slug, choose Yüzük/Kolye/Küpe/Bileklik, enter a price and upload an **Ana Görsel**. Set **Yayında** to true and **Sıralama** to 1. Click Sanity's **Publish** action too: the Yayında boolean does not publish a draft by itself.
4. Refresh the catalogue and home page. You should see the new product with its real TL price and existing card design. Click **İncele** to test its reusable detail page. Search and category tabs should work with Sanity's singular category names.
5. Add another product with sort order 2; it should follow order 1. Missing sort order values come last, with name/id used as tie-breakers. Set a product's Yayında to false and publish that change; it must disappear from Sanity results on refresh.
6. Check at desktop and phone widths. No CSS or responsive rules were changed.

## Fallback and troubleshooting

During the request the original hardcoded HTML remains visible. Once at least one usable Sanity product loads, Sanity replaces the home/catalogue data; it is not merged with demo products. Existing card markup/classes and CSS are reused.

On a network/CORS/HTTP error, a 10-second timeout, or zero usable published products, local products remain available. This is deliberately a test-stage fallback, so an empty Sanity catalogue does **not** produce an empty website. Products missing a name, slug, or main image are skipped; duplicate slugs are skipped. A missing price stays blank, never replaced with an invented price or price enquiry.

Use browser DevTools Console to check:

```js
document.documentElement.dataset.productSource
```

`sanity` = live products loaded; `loading` = request pending; `fallback` = local products. Console messages explain empty/error cases. DevTools Network should show a GET to `p1o6t3yx.api.sanity.io`, dataset `production`, with `perspective=published`. The query filters `_type == "product" && published == true` and orders by sortOrder ascending. An explicit Sanity detail link never substitutes an unrelated local product when the API fails.

The direct API is used rather than the CDN during testing so saved/published changes can be checked on refresh. No credentials are sent and nothing is deployed automatically.

Optional adapter checks (Node is only a test runner, not a website dependency):

```sh
node --test tests/sanity-products.test.cjs
```

## Verification on 6 October 2026

- JavaScript syntax checks and all four adapter tests passed (category mapping, valid/absent/zero prices, invalid records and URLs, query/perspective, empty responses, HTTP/network failures).
- The anonymous live API read succeeded and returned one usable published product: `yuzuk no1`, slug `yuzuk`, category `Yüzük`, price 12000.
- With Origin `http://127.0.0.1:5500`, the API explicitly returned HTTP 403, `CORS Origin not allowed`. That exact origin still needs adding manually. No Sanity settings were changed.
- The real browser request correctly preserved the 10 local fallback products.
- To test rendering before CORS is configured, a temporary local QA server replayed the same live API response. Home/catalogue rendering, price formatting, category filtering, search (including no results), and the slug-linked detail page passed. Catalogue and detail passed the 390px mobile overflow check; desktop also had no horizontal overflow. Product image loaded correctly. This test server is not part of the website and must not be deployed.
- `tests/sanity-card-preview.png` shows that local response-replay test, not a claim that live browser CORS is already configured.

Files changed for this integration: `js/site.js` (modified), `js/sanity-products.js`, `SANITY-SETUP.md`, `tests/sanity-products.test.cjs`, `tests/sanity-card-preview.png` (created).
