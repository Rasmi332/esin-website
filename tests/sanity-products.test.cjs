// Optional developer checks: node --test tests/sanity-products.test.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/sanity-products.js'), 'utf8');
const moduleReady = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const record = (extra = {}) => ({name: 'İnce Yüzük', slug: 'ince-yuzuk', category: 'Yüzük', price: 12345.5,
  image: 'https://cdn.sanity.io/images/p1o6t3yx/production/example-800x1000.jpg',
  dimensions: {width: 800, height: 1000}, sortOrder: 2, ...extra});

test('maps all four categories, prices and image metadata without inventing product data', async () => {
  const {normalizeProducts} = await moduleReady;
  const products = normalizeProducts(['Yüzük', 'Kolye', 'Küpe', 'Bileklik'].map((category, i) => record({category, slug: 'p-' + i})));
  assert.deepEqual(products.map(p => p.categorySlug), ['yuzukler', 'kolyeler', 'kupeler', 'bileklikler']);
  assert.equal(products[0].price, 12345.5);
  assert.equal(products[0].sortOrder, 2);
  assert.deepEqual(products[0].imageDimensions, {width: 800, height: 1000});
  assert.equal(products[0].source, 'sanity');
  assert.equal(normalizeProducts([record({price: 0})])[0].price, 0);
  assert.equal(normalizeProducts([record({price: null})])[0].price, null);
});

test('rejects incomplete records, duplicate slugs and untrusted images', async () => {
  const {normalizeProducts} = await moduleReady;
  assert.equal(normalizeProducts([null, record({name: ''}), record({slug: null}), record({image: null}),
    record({image: 'javascript:alert(1)'}), record({image: 'https://example.com/photo.jpg'}),
    record({image: 'https://cdn.sanity.io/images/another/project/photo.jpg'})]).length, 0);
  assert.equal(normalizeProducts([record(), record()]).length, 1);
  assert.throws(() => normalizeProducts({}), /invalid product list/);
});

test('keeps optional detail fields, strict featured boolean and ordered valid gallery images', async () => {
  const {normalizeProducts} = await moduleReady;
  const second = record({image: 'https://cdn.sanity.io/images/p1o6t3yx/production/second-600x900.jpg', dimensions: {width: 600, height: 900}});
  const third = record({image: 'https://cdn.sanity.io/images/p1o6t3yx/production/third-700x800.jpg'});
  const [product] = normalizeProducts([record({description: '  İlk satır\nİkinci satır  ', material: ' Altın ',
    karat: '14', stone: '<b>Pırlanta</b>', featured: true,
    gallery: [second, null, {image: 'https://example.com/wrong.jpg'}, third]})]);
  assert.equal(product.description, 'İlk satır\nİkinci satır');
  assert.equal(product.material, 'Altın');
  assert.equal(product.karat, '14');
  assert.equal(product.stone, '<b>Pırlanta</b>'); // Rendering must escape text, not trust HTML.
  assert.equal(product.featured, true);
  assert.equal(product.gallery.length, 2);
  assert.match(product.gallery[0].image, /second-600x900/);
  assert.match(product.gallery[1].image, /third-700x800/);
  assert.deepEqual(product.gallery[0].imageDimensions, {width: 600, height: 900});
});

test('empty optional fields stay empty and missing/false featured never becomes true', async () => {
  const {normalizeProducts} = await moduleReady;
  for (const featured of [undefined, null, false, 'true', 1]) {
    const [product] = normalizeProducts([record({description: ' \n ', material: null, karat: undefined,
      stone: '', featured, gallery: null})]);
    assert.deepEqual([product.description, product.material, product.karat, product.stone], ['', '', '', '']);
    assert.equal(product.featured, false);
    assert.deepEqual(product.gallery, []);
  }
});

test('queries only published products, sorts them and uses anonymous published perspective', async t => {
  const {fetchSanityProducts} = await moduleReady;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.origin, 'https://p1o6t3yx.api.sanity.io');
    assert.equal(url.pathname, '/v2025-02-19/data/query/production');
    assert.match(url.searchParams.get('query'), /published == true/);
    for (const field of ['description', 'material', 'karat', 'stone', 'featured', 'gallery']) {
      assert.match(url.searchParams.get('query'), new RegExp('\\b' + field + '\\b'));
    }
    assert.match(url.searchParams.get('query'), /order\(coalesce\(sortOrder, 2147483647\) asc, name asc, _id asc\)/);
    assert.equal(url.searchParams.get('perspective'), 'published');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.headers, undefined);
    return {ok: true, json: async () => ({result: [record()]})};
  });
  assert.equal((await fetchSanityProducts())[0].slug, 'ince-yuzuk');
});

test('distinguishes empty results from API/network failures for fallback handling', async t => {
  const {fetchSanityProducts} = await moduleReady;
  const mock = t.mock.method(globalThis, 'fetch', async () => ({ok: true, json: async () => ({result: []})}));
  assert.deepEqual(await fetchSanityProducts(), []);
  mock.mock.mockImplementation(async () => ({ok: false, status: 403}));
  await assert.rejects(fetchSanityProducts(), /HTTP 403/);
  mock.mock.mockImplementation(async () => {throw new TypeError('Failed to fetch');});
  await assert.rejects(fetchSanityProducts(), /Failed to fetch/);
  mock.mock.mockImplementation(async () => ({ok: true, json: async () => ({error: {description: 'bad query'}})}));
  await assert.rejects(fetchSanityProducts(), /query error/);
});
