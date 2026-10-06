# ESİN static website — verification

Updated and tested on 3 October 2026.

- 22 HTML pages served successfully, including all 10 dedicated product pages, the reusable product page, and the 404 page.
- 1,157 links and asset references checked. Local files and anchors resolve; every page retains the store telephone and supplied Google Maps listing.
- 163 image elements have descriptive alt text.
- 66 browser page checks: all 22 pages at 390px, 768px, and 1440px widths. No horizontal overflow, missing main headings, broken loaded images, old trust wording, contact forms, or removed strip containers were found.
- 42 interaction checks passed: all category counts, Turkish search, empty-search reset, keyboard categories, all galleries, all product contact links, mobile menu focus trap and Escape, mobile navigation, Pırlanta/Alyans information states, reusable details, and missing-product fallback. The hero also passed at 320px and 1024px.
- The contact block is deleted, including form fields, notices, submission controls, layout container, CSS, and form JavaScript. Contact links now reach the store details rather than the removed form.
- The hero is immediately followed by the next content section; the four-item strip and its responsive CSS rules are deleted.
- JavaScript syntax checks passed. Final browser console inspection returned no errors.
- Desktop and mobile screenshots were reviewed, along with the about and store page layouts.

The delivered website contains only HTML, CSS, vanilla JavaScript, assets, and documentation. There is no build command or server application. Product names, descriptions, categories, and gallery images are editable in js/products.js.

Phone, Google Maps, and Instagram destinations were inspected without placing calls or sending messages. Their external behavior depends on the visitor's device and connection. Pages were tested over local HTTP; direct file:// browsing is not supported by the automated testing browser. Classic scripts and relative links support opening the extracted files locally.

The supplied visual assets are used as provided. The separately mentioned future visual set has not yet been received. Existing legal placeholder content remains.

## Two-visual hero revision

The reference layout is restored with campaign-1.jpg and campaign-2.jpg side by side. Both remain visible on phones and tablets. The headline reads “Sana uyduğu için değil, sana benzediği için.” Large editorial areas use jewelry still lifes; worn jewelry photos stay in small cards and lookbook images, with product-gallery versions capped at 300 × 360 pixels.

For this revision, all 22 pages and 1,157 references passed the file/link checks. Twenty-five focused browser checks covered the homepage, about page, and three on-body product pages at 320, 390, 768, 1024, and 1440 pixels. Both hero photos remained visible, no horizontal overflow was found, and compact gallery sizing passed. Switching between an on-body image and a still life applied and cleared compact sizing correctly. No browser console errors were recorded. Desktop and mobile screenshots were inspected.