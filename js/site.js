/* ESİN — vanilla JavaScript interactions. No dependencies and no build step. */
(async function () {
  'use strict';
  const data = window.ESIN_DATA;
  if (!data) return;
  const rootURL = new URL('../', document.currentScript.src);
  const link = (file) => new URL(file, rootURL).href;
  const escape = (text) => String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const imageURL = (image) => typeof image === 'string' && image.startsWith('https://cdn.sanity.io/') ? image : link('assets/' + (typeof image === 'number' ? `campaign-${image}.jpg` : image));
  const imageSize = (image) => data.images?.[typeof image === 'number' ? `campaign-${image}.jpg` : image] || { width: 272, height: 363 };
  const productURL = (product) => link(product.page || `urun-detay.html?urun=${encodeURIComponent(product.slug)}${product.source === 'sanity' ? '&source=sanity' : ''}`);
  const formatPrice = (product) => product.source === 'sanity'
    ? (product.price === null ? '' : new Intl.NumberFormat('tr-TR', {style: 'currency', currency: 'TRY'}).format(product.price))
    : 'Fiyat için iletişime geçin';

  function productCard(product) {
    const url = escape(productURL(product));
    return `<article class="product-card" data-product="${escape(product.slug)}"><a href="${url}" class="product-photo" aria-label="${escape(product.name)} ürününü incele"><img src="${escape(imageURL(product.image))}" alt="${escape(product.name)}" width="${imageSize(product.image).width}" height="${imageSize(product.image).height}" loading="lazy" decoding="async">${product.collection ? '<span class="product-tag">MIRA</span>' : ''}<span class="product-hover">Ürünü İncele</span></a><div class="product-meta"><span>${escape(product.category)}</span><h3><a href="${url}">${escape(product.name)}</a></h3><div class="product-bottom"><p>${escape(formatPrice(product))}</p><a href="${url}">İncele</a></div></div></article>`;
  }

  // Same sticky-header behavior as the original site.
  const header = document.querySelector('.site-header');
  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Full-screen mobile menu: focus trap, Escape, backdrop, and focus restoration.
  const menu = document.getElementById('mobile-menu');
  const overlay = document.querySelector('.menu-overlay');
  const opener = document.querySelector('[data-menu-open]');
  const closer = document.querySelector('[data-menu-close]');
  const background = [...document.body.children].filter(element => element !== menu && element !== overlay && element.tagName !== 'SCRIPT');
  let menuOpen = false;
  let savedOverflow = '';
  let savedPadding = '';
  let closeTimer;
  function openMenu() {
    clearTimeout(closeTimer);
    savedOverflow = document.body.style.overflow;
    savedPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar) document.body.style.paddingRight = `${scrollbar}px`;
    background.forEach(element => { element.inert = true; });
    menu.hidden = false;
    overlay.hidden = false;
    menu.classList.remove('is-closing');
    menu.classList.add('is-open');
    overlay.classList.add('is-open');
    opener.setAttribute('aria-expanded', 'true');
    menuOpen = true;
    closer.focus({ preventScroll: true });
  }
  function closeMenu(animate = true) {
    if (!menuOpen) return;
    menuOpen = false;
    opener.setAttribute('aria-expanded', 'false');
    const finish = () => {
      menu.hidden = true;
      overlay.hidden = true;
      menu.classList.remove('is-open', 'is-closing');
      overlay.classList.remove('is-open');
      document.body.style.overflow = savedOverflow;
      document.body.style.paddingRight = savedPadding;
      background.forEach(element => { element.inert = false; });
      opener.focus({ preventScroll: true });
    };
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      menu.classList.remove('is-open');
      menu.classList.add('is-closing');
      closeTimer = setTimeout(finish, 300);
    } else finish();
  }
  opener.addEventListener('click', openMenu);
  closer.addEventListener('click', () => closeMenu());
  overlay.addEventListener('click', () => closeMenu());
  menu.querySelectorAll('a').forEach(anchor => anchor.addEventListener('click', () => closeMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (!menuOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
    if (event.key === 'Tab') {
      const focusable = [...menu.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  // Keep all static HTML and local data. Swap the data only after a successful read.
  // Menus/header are already interactive while the read is pending.
  const sanityDetail = document.body.dataset.page === '/urun-detay' && new URLSearchParams(location.search).get('source') === 'sanity';
  const useSanity = sanityDetail || document.querySelector('#catalogue-grid, [data-products="all"], [data-products="featured"]');
  if (useSanity) {
    document.documentElement.dataset.productSource = 'loading';
    try {
      const {fetchSanityProducts} = await import(link('js/sanity-products.js'));
      const products = await fetchSanityProducts();
      if (products.length) {
        data.products = products;
        data.images = {...data.images};
        products.forEach(product => {
          data.images[product.image] = product.imageDimensions;
          product.gallery.forEach(item => { data.images[item.image] = item.imageDimensions; });
        });
        document.documentElement.dataset.productSource = 'sanity';
        console.info(`[ESİN] Loaded ${products.length} published Sanity products.`);
        const note = document.querySelector('.catalogue > .catalogue-note');
        if (note) note.hidden = true;
      } else {
        document.documentElement.dataset.productSource = 'fallback';
        console.info('[ESİN] No usable published Sanity products yet. Keeping local products.');
      }
    } catch (error) {
      document.documentElement.dataset.productSource = 'fallback';
      console.warn('[ESİN] Sanity unavailable; keeping local products. See SANITY-SETUP.md for CORS/public dataset setup.', error);
    }
  }

  // Existing card structure is shared by local and Sanity products.
  document.querySelectorAll('[data-products]').forEach(grid => {
    const kind = grid.dataset.products;
    let products = data.products;
    if (kind === 'featured') {
      products = products.filter(product => product.source === 'sanity' && product.featured === true);
      const section = grid.closest('[data-featured-section]');
      if (section) section.hidden = products.length === 0;
    }
    if (kind === 'mira') products = products.filter(product => product.collection === 'Mira');
    if (kind === 'related') {
      const selected = data.products.find(product => product.slug === grid.dataset.related);
      products = selected ? products.filter(product => product.slug !== selected.slug && product.category === selected.category).slice(0, 4) : [];
    }
    grid.innerHTML = products.map(productCard).join('');
  });

  // Category filters, Turkish-aware search, URL state, and keyboard tab controls.
  const catalogue = document.querySelector('.catalogue');
  if (catalogue) {
    const tabs = [...catalogue.querySelectorAll('[role="tab"]')];
    const panel = catalogue.querySelector('[role="tabpanel"]');
    const search = catalogue.querySelector('input[type="search"]');
    const resultsMeta = panel.querySelector('.results-meta');
    const initialGrid = panel.querySelector('.product-grid');
    const results = document.createElement('div');
    results.className = 'catalogue-results-body';
    initialGrid.replaceWith(results);
    catalogue.querySelectorAll('[role="tabpanel"][hidden]').forEach(element => element.remove());
    let category = 'tumu';
    const validCategory = (value) => value === 'tumu' || data.categories.some(item => item.slug === value);
    function renderResults() {
      const selected = data.categories.find(item => item.slug === category);
      const query = search.value.toLocaleLowerCase('tr');
      const products = data.products.filter(product => (!selected || product.categorySlug === selected.slug || product.category === selected.name) && product.name.toLocaleLowerCase('tr').includes(query));
      resultsMeta.firstElementChild.textContent = `${products.length} ürün`;
      tabs.forEach(tab => {
        const active = tab.dataset.category === category;
        tab.setAttribute('aria-selected', String(active));
        tab.dataset.state = active ? 'active' : 'inactive';
        tab.tabIndex = active ? 0 : -1;
      });
      const activeTab = tabs.find(tab => tab.dataset.category === category);
      if (activeTab) panel.setAttribute('aria-labelledby', activeTab.id);
      else panel.removeAttribute('aria-labelledby');
      if (selected?.information) {
        results.innerHTML = `<div class="empty-state"><h2>${escape(selected.name)}</h2><p>Bu kategorideki güncel modelleri mağazamızda keşfedebilirsiniz. Seçenekler ve fiyat bilgisi için bizi arayın.</p><div class="inline-actions"><a class="button dark" href="${escape(data.store.tel)}">Bizi Arayın</a><a class="text-link" href="${escape(link('magazamiz.html'))}">Mağazada Gör</a><button class="text-link" data-reset-category>Tüm Ürünler</button></div></div>`;
      } else if (products.length) results.innerHTML = `<div class="product-grid" id="catalogue-grid">${products.map(productCard).join('')}</div>`;
      else results.innerHTML = '<div class="empty-state"><h2>Bir başka seçime bakalım.</h2><p>Aramanıza uygun bir ürün bulunamadı.</p><button class="button outline" data-reset-search>Aramayı Temizle</button></div>';
    }
    function chooseCategory(value, updateURL = true) {
      category = validCategory(value) ? value : 'tumu';
      if (updateURL) {
        const url = new URL(window.location.href);
        if (category === 'tumu') url.searchParams.delete('kategori');
        else url.searchParams.set('kategori', category);
        // Browsers can restrict history changes for file://; filtering still works.
        try { history.replaceState(null, '', url); } catch (_) { /* Local-file fallback. */ }
      }
      renderResults();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => chooseCategory(tab.dataset.category));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); tabs[next].focus(); chooseCategory(tabs[next].dataset.category); }
      });
    });
    search.addEventListener('input', renderResults);
    results.addEventListener('click', event => {
      if (event.target.closest('[data-reset-search]')) { search.value = ''; chooseCategory('tumu'); search.focus(); }
      if (event.target.closest('[data-reset-category]')) chooseCategory('tumu');
    });
    window.addEventListener('popstate', () => chooseCategory(new URLSearchParams(location.search).get('kategori') || 'tumu', false));
    chooseCategory(new URLSearchParams(location.search).get('kategori') || 'tumu', false);
  }

  // Detail pages and image galleries use the same central product data.
  const detail = document.querySelector('[data-detail]');
  if (detail) {
    const reusablePage = document.body.dataset.page === '/urun-detay';
    const slug = reusablePage ? new URLSearchParams(location.search).get('urun') || detail.dataset.detail : detail.dataset.detail;
    const product = sanityDetail && document.documentElement.dataset.productSource !== 'sanity' ? null : data.products.find(item => item.slug === slug);
    if (!product) {
      document.title = 'Sayfa Bulunamadı | ESİN Kuyumculuk';
      document.getElementById('main').innerHTML = `<div class="empty-state wrap"><p class="eyebrow">ESİN KUYUMCULUK</p><h1>Sayfa Bulunamadı</h1><p>Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p><a href="${escape(link('index.html'))}" class="button dark">Ana Sayfaya Dön</a></div>`;
    } else {
      detail.querySelector('h1').textContent = product.name;
      detail.querySelector('.product-description').textContent = product.description || 'Yakın hissettiğin bir form, sana ait bir detay.';
      if (product.source === 'sanity') {
        const description = detail.querySelector('.product-description');
        description.textContent = product.description;
        description.hidden = !product.description;
        description.setAttribute('aria-label', 'Açıklama');
        // Preserve authored line breaks without interpreting content as HTML.
        description.replaceChildren(...product.description.split(/\r?\n/).flatMap((line, index) =>
          index ? [document.createElement('br'), document.createTextNode(line)] : [document.createTextNode(line)]));
        detail.querySelector('.price-contact p').textContent = formatPrice(product);
        detail.querySelector('.price-contact').hidden = product.price === null;
        detail.querySelector('.price-contact span').hidden = true;
        detail.querySelector('.catalogue-note').hidden = true;
      }
      document.title = `${product.name} | ESİN Kuyumculuk`;
      document.querySelector('.detail-breadcrumb > span:last-child').textContent = product.name;
      detail.querySelector('.eyebrow').textContent = product.collection ? 'MİRA KOLEKSİYONU' : product.category.toLocaleUpperCase('tr');
      detail.querySelector('.detail-actions a').href = link('magazamiz.html#iletisim');
      detail.querySelector('.product-specs').innerHTML = `<div><dt>Kategori</dt><dd>${escape(product.category)}</dd></div>${product.collection ? `<div><dt>Koleksiyon</dt><dd>${escape(product.collection)}</dd></div>` : ''}<div><dt>Ürün bilgileri</dt><dd>Mağazamızdan bilgi alabilirsiniz.</dd></div>`;
      if (product.source === 'sanity') {
        const specs = detail.querySelector('.product-specs');
        const rows = [['Kategori', product.category], ['Materyal', product.material], ['Ayar', product.karat], ['Taş Bilgisi', product.stone]]
          .filter(([, value]) => value && value.trim());
        specs.innerHTML = rows.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('');
        specs.hidden = rows.length === 0;
      }
      const gallery = [{ image: product.image, label: 'Ürün görseli' }];
      if (product.alternateImage) gallery.push({ image: product.alternateImage, label: 'Seçkiden yakın görünüm' });
      if (product.source === 'sanity') {
        product.gallery.forEach((item, index) => gallery.push({image: item.image, label: `Galeri görseli ${index + 1}`}));
      }

      const mainImage = detail.querySelector('.gallery-main img');
      const caption = detail.querySelector('.image-caption');
      const thumbnails = detail.querySelector('.gallery-thumbs');
      if (product.source === 'sanity') thumbnails.dataset.sanityGallery = '';
      thumbnails.innerHTML = gallery.map((item, index) => `<button type="button" data-image="${index}" aria-pressed="${index === 0}" aria-label="${escape(item.label)}"><img src="${escape(imageURL(item.image))}" alt="${escape(item.label)}" width="${imageSize(item.image).width}" height="${imageSize(item.image).height}" loading="lazy" decoding="async"></button>`).join('');
      function showImage(index) {
        const item = gallery[index];
        mainImage.src = imageURL(item.image);
        mainImage.parentElement.dataset.worn = String(Boolean(data.images?.[typeof item.image === 'number' ? `campaign-${item.image}.jpg` : item.image]?.worn));
        mainImage.alt = `${product.name} — ${item.label}`;
        mainImage.width = imageSize(item.image).width;
        mainImage.height = imageSize(item.image).height;
        caption.textContent = item.label;
        thumbnails.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(index === i)));
      }
      thumbnails.addEventListener('click', event => {
        const button = event.target.closest('[data-image]');
        if (button) showImage(Number(button.dataset.image));
      });
      showImage(0);
      // The reusable detail page can also display newly added products.
      const related = document.querySelector('[data-products="related"]');
      if (related) {
        const siblings = data.products.filter(item => item.slug !== product.slug && item.category === product.category).slice(0, 4);
        related.innerHTML = siblings.map(productCard).join('');
        related.closest('section').hidden = !siblings.length;
      }
    }
  }

  const copyright = document.querySelector('.footer-bottom > span');
  if (copyright) copyright.textContent = `© ${new Date().getFullYear()} ESİN Kuyumculuk`;
})();
