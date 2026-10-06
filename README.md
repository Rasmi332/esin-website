# ESİN Kuyumculuk — static website

This folder is the complete website. It contains only HTML, CSS, vanilla JavaScript, images, and this guide. There is no installation, build command, database, or server application.

## Preview and deploy

1. Extract the ZIP before using the files. Open `index.html` in a browser to preview locally, or use your editor's static preview.
2. To deploy, upload the **contents of this folder** to your static host's public folder. Keep all filenames and folders together. The entry page is `index.html`.
3. If the host supports a custom error page, choose `404.html`.

Links use explicit `.html` filenames and relative paths. The site can live at a domain root or in a subfolder. Old extensionless URLs such as `/urunler` need optional redirects configured at your hosting provider to their new `.html` equivalents. The website itself needs no routing server.

## Where to edit

| Change | File |
| --- | --- |
| Product names, descriptions, categories, images, collection, and gallery choices | `js/products.js` — the clearly labeled `products` array |
| Homepage text and sections | `index.html` |
| About, store, gold trading, and legal copy | Corresponding `.html` file |
| Colors, typography, spacing, and responsive layout | `css/styles.css` |
| Basic element defaults and mobile-menu behavior styles | `css/base.css` |
| Menu, filters, search, galleries, and contact navigation | `js/site.js` |
| All images and the favicon | `assets/` |

Header and footer markup are included in every HTML page so no server or template engine is needed. Apply shared navigation or contact-detail changes to every HTML file. `store` in `products.js` supplies the dynamic inquiry links; visible store copy and structured metadata are also present in HTML.

## Edit products in one place

Open `js/products.js` in a text editor. Each object in `products` represents one product. Keep quotes and commas intact. Existing product pages, catalogue results, related products, homepage cards, and Mira cards read this file automatically in the browser.

* `slug`: unique URL identifier; keep existing slugs unchanged.
* `name`: displayed product name.
* `description`: the product's descriptive paragraph, focusing on form, detail, and feeling.
* `category`: one of `Yüzükler`, `Kolyeler`, `Bileklikler`, or `Küpeler`.
* `image`: a number from 1–10 selects `assets/campaign-N.jpg`; a filename selects your own image in `assets/`.
* `alternateImage`: optional second product image, using the same format.
* `collection`: set to `Mira` for Mira products, or omit it.
* `page`: existing dedicated HTML page path. Keep this for existing products.

To add a product, copy an object, choose a unique slug, update the fields, and **omit `page`**. It will automatically link to `urun-detay.html?urun=your-slug`. Add its photo to `assets/`. No new HTML page or build is required.

Existing HTML also contains the original product content as a fallback when JavaScript is disabled. For search-engine metadata and this fallback to reflect future product edits, update the relevant dedicated HTML file's title, description, and original product markup too. Interactive views use the central data file.

## Brand direction and behavior

The opening statement is “Sana uyduğu için değil, sana benzediği için.” The original two still-life photographs lead the homepage: sunlit rings and colored-stone rings on navy rope. Large editorial images use jewelry still lifes. Photos of jewelry being worn remain in small cards and the lookbook; product-gallery versions are capped at 300px wide and 360px tall. Set `worn: true` on an image in the `images` section of `js/products.js` to keep it compact in galleries. Copy focuses on form, detail, workmanship, and personal feeling with a warm, approachable voice.

The entire lower contact/form block and four-item strip beneath the homepage hero have been removed, including their CSS and form JavaScript. Product “Bilgi Al” and navigation “İletişim” links now lead to the real store contact details at `magazamiz.html#iletisim`. Phone links open the device's calling app; Maps and Instagram links retain their original destinations. There is no form or form endpoint. The general store-display photo no longer appears as a product-gallery image. Existing legal placeholder pages and sample product-information notices remain.

To use new photos, put them in `assets/` and edit the relevant image field in `js/products.js` or the editorial image in its HTML page. Update the corresponding width/height in the `images` section of `products.js` and HTML image attributes when dimensions change. Product galleries support an optional `alternateImage` of the same piece.

## Validation

See `TEST-RESULTS.md`. All pages were tested over local HTTP. Direct `file://` browser testing was blocked by the testing browser's protocol policy; the implementation uses classic scripts and relative paths, with no fetch requests or module imports, to support opening files locally.
