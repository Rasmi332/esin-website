/* Browser-only, read-only Sanity connection. No token or SDK is needed.
 * The production dataset must allow public reads; see SANITY-SETUP.md.
 */
export const SANITY = {
  projectId: 'p1o6t3yx',
  dataset: 'production',
  apiVersion: '2025-02-19',
};

export const PRODUCT_QUERY = `*[_type == "product" && published == true]
  | order(coalesce(sortOrder, 2147483647) asc, name asc, _id asc) {
    _id, name, category, price, "slug": slug.current, sortOrder,
    description, material, karat, stone, featured,
    gallery[]{_key, "image": asset->url, "dimensions": asset->metadata.dimensions},
    "image": mainImage.asset->url,
    "dimensions": mainImage.asset->metadata.dimensions
  }`;

const categorySlugs = {
  'Yüzük': 'yuzukler',
  'Kolye': 'kolyeler',
  'Küpe': 'kupeler',
  'Bileklik': 'bileklikler',
};

const textValue = value => typeof value === 'string' ? value.trim() : '';

function normalizeImage(record) {
  let image;
  try { image = new URL(record?.image); } catch (_) { return null; }
  if (image.protocol !== 'https:' || image.hostname !== 'cdn.sanity.io' ||
      !image.pathname.startsWith(`/images/${SANITY.projectId}/${SANITY.dataset}/`)) return null;
  image.searchParams.set('w', '1000');
  image.searchParams.set('auto', 'format');
  const size = record.dimensions;
  return {
    image: image.href,
    imageDimensions: size?.width > 0 && size?.height > 0
      ? {width: size.width, height: size.height} : {width: 272, height: 363},
  };
}

export function normalizeProducts(records) {
  if (!Array.isArray(records)) throw new Error('Sanity returned an invalid product list.');
  const seen = new Set();
  return records.flatMap(record => {
    if (!record || typeof record.name !== 'string' || !record.name.trim() ||
        typeof record.slug !== 'string' || !record.slug.trim() || seen.has(record.slug)) return [];
    // Never render arbitrary URLs from content or substitute another product's photograph.
    const mainImage = normalizeImage(record);
    if (!mainImage) return [];
    seen.add(record.slug);
    const gallery = (Array.isArray(record.gallery) ? record.gallery : [])
      .map(normalizeImage).filter(Boolean);
    return [{
      name: record.name.trim(),
      slug: record.slug,
      category: typeof record.category === 'string' ? record.category : '',
      categorySlug: categorySlugs[record.category] || '',
      price: typeof record.price === 'number' && Number.isFinite(record.price) ? record.price : null,
      ...mainImage,
      description: textValue(record.description),
      material: textValue(record.material),
      karat: textValue(record.karat),
      stone: textValue(record.stone),
      featured: record.featured === true,
      gallery,
      sortOrder: typeof record.sortOrder === 'number' && Number.isFinite(record.sortOrder)
        ? record.sortOrder : 2147483647,
      source: 'sanity',
    }];
  });
}

export async function fetchSanityProducts() {
  // Use the uncached API for this test integration so published edits appear on refresh.
  const url = new URL(`https://${SANITY.projectId}.api.sanity.io/v${SANITY.apiVersion}/data/query/${SANITY.dataset}`);
  url.searchParams.set('query', PRODUCT_QUERY);
  url.searchParams.set('perspective', 'published');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {credentials: 'omit', signal: controller.signal});
    if (!response.ok) throw new Error(`Sanity request failed (HTTP ${response.status}).`);
    const payload = await response.json();
    if (payload.error) throw new Error('Sanity returned a query error.');
    return normalizeProducts(payload.result);
  } finally {
    clearTimeout(timeout);
  }
}
