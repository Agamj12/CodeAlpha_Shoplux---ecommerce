let productsState = { category: '', sort: 'newest', search: '', page: 1, featured: false };

function renderProductsPage(params = {}) {
  productsState = { category: '', sort: 'newest', search: '', page: 1, featured: false, ...params };
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="page">
      <div class="section-header">
        <h1 class="section-title">${productsState.category ? productsState.category : 'All'} <span>Products</span></h1>
        <select class="form-control" style="width:180px" id="sort-select" onchange="changeSort(this.value)">
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>
      <div class="filters" id="cat-filters"><div class="loader-ring" style="margin:0 auto"></div></div>
      <div class="products-grid" id="products-grid"><div class="loader-ring" style="margin:60px auto"></div></div>
      <div class="pagination" id="pagination"></div>
    </div>`;
  document.getElementById('sort-select').value = productsState.sort;
  loadCategories();
  loadProducts();
}

async function loadCategories() {
  try {
    const cats = await API.get('/products/meta/categories');
    const el = document.getElementById('cat-filters');
    if (!el) return;
    el.innerHTML = `<button class="filter-btn ${!productsState.category ? 'active' : ''}" onclick="filterCategory('')">All</button>` +
      cats.map(c => `<button class="filter-btn ${productsState.category === c.name ? 'active' : ''}" onclick="filterCategory('${c.name}')">${c.icon} ${c.name}</button>`).join('');
  } catch (e) {}
}

async function loadProducts() {
  const el = document.getElementById('products-grid');
  if (!el) return;
  el.innerHTML = '<div class="loader-ring" style="margin:60px auto"></div>';
  try {
    const q = new URLSearchParams({ sort: productsState.sort, page: productsState.page, limit: 12 });
    if (productsState.category) q.set('category', productsState.category);
    if (productsState.search) q.set('search', productsState.search);
    if (productsState.featured) q.set('featured', 'true');
    const data = await API.get('/products?' + q);
    el.innerHTML = data.products.length
      ? data.products.map(renderProductCard).join('')
      : '<div class="empty-state"><div class="icon">&#128230;</div><h3>No products found</h3><p>Try adjusting your filters</p></div>';
    const pg = document.getElementById('pagination');
    if (pg && data.totalPages > 1) {
      pg.innerHTML = Array.from({ length: data.totalPages }, (_, i) =>
        `<button class="page-btn ${i + 1 === productsState.page ? 'active' : ''}" onclick="changePage(${i + 1})">${i + 1}</button>`
      ).join('');
    }
  } catch (e) { el.innerHTML = '<div class="empty-state"><div class="icon">&#9888;</div><h3>Failed to load</h3></div>'; }
}

function filterCategory(cat) {
  productsState.category = cat;
  productsState.page = 1;
  loadCategories();
  loadProducts();
}

function changeSort(val) {
  productsState.sort = val;
  productsState.page = 1;
  loadProducts();
}

function changePage(p) {
  productsState.page = p;
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
