function renderHome() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <section class="hero">
      <div class="hero-orbs"><div class="orb orb1"></div><div class="orb orb2"></div></div>
      <div class="hero-content">
        <div class="hero-badge">&#10024; New arrivals every week</div>
        <h1>Shop the <span>Future</span><br>of Commerce</h1>
        <p>Discover premium products curated for the modern lifestyle. Quality, style, and value — all in one place.</p>
        <div class="hero-btns">
          <button class="btn-primary" onclick="app.navigate('products')" style="padding:14px 32px;font-size:1rem">Shop Now &#8594;</button>
          <button class="btn-secondary" onclick="app.navigate('products',{featured:true})" style="padding:14px 32px;font-size:1rem">Featured Items</button>
        </div>
      </div>
    </section>
    <div class="section-divider">
      <div class="section" id="categories-section">
        <div class="section-header">
          <h2 class="section-title">Shop by <span>Category</span></h2>
        </div>
        <div class="categories-grid" id="categories-grid"><div class="loader-ring" style="margin:40px auto"></div></div>
      </div>
      <div class="section" id="featured-section">
        <div class="section-header">
          <h2 class="section-title">&#11088; Featured <span>Products</span></h2>
          <a class="see-all" onclick="app.navigate('products')">See all &#8594;</a>
        </div>
        <div class="products-grid" id="featured-grid"><div class="loader-ring" style="margin:40px auto"></div></div>
      </div>
      <div class="section">
        <div class="features-grid">
          <div class="feature-card"><div class="feature-icon">&#128666;</div><h3>Free Shipping</h3><p>On orders over ₹4,999. Fast and reliable delivery to your door.</p></div>
          <div class="feature-card"><div class="feature-icon">&#128274;</div><h3>Secure Payments</h3><p>Your payment info is always protected with encryption.</p></div>
          <div class="feature-card"><div class="feature-icon">&#128260;</div><h3>Easy Returns</h3><p>30-day hassle-free return policy on all items.</p></div>
          <div class="feature-card"><div class="feature-icon">&#128222;</div><h3>24/7 Support</h3><p>Our team is always ready to help you anytime.</p></div>
        </div>
      </div>
    </div>`;
  loadHomeData();
}

async function loadHomeData() {
  try {
    const [cats, featured] = await Promise.all([
      API.get('/products/meta/categories'),
      API.get('/products?featured=true&limit=8')
    ]);
    const catsEl = document.getElementById('categories-grid');
    if (catsEl) catsEl.innerHTML = cats.map(c => `
      <div class="category-card" onclick="app.navigate('products',{category:'${c.name}'})">
        <div class="category-icon">${c.icon}</div>
        <div class="category-name">${c.name}</div>
      </div>`).join('');
    const featEl = document.getElementById('featured-grid');
    if (featEl) featEl.innerHTML = featured.products.map(renderProductCard).join('');
  } catch (e) { Toast.show('Failed to load content', 'error'); }
}

function renderProductCard(p) {
  const discount = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
  const stars = '&#9733;'.repeat(Math.round(p.rating || 0)) + '&#9734;'.repeat(5 - Math.round(p.rating || 0));
  return `
    <div class="product-card" onclick="app.navigate('product',{id:${p.id}})">
      ${p.image
        ? `<img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''
      }
      <div class="product-img-placeholder" ${p.image ? 'style="display:none"' : ''}>${p.category_icon || '&#128230;'}</div>
      <div class="product-body">
        <div class="product-category">${p.category_name || 'General'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating"><span class="stars">${stars}</span>${p.rating} (${p.reviews_count})</div>
        <div class="product-price-row">
          <span class="product-price">&#8377;${p.price.toLocaleString('en-IN')}</span>
          ${p.original_price ? `<span class="product-original">&#8377;${p.original_price.toLocaleString('en-IN')}</span><span class="product-discount">-${discount}%</span>` : ''}
        </div>
        <button class="add-cart-btn" onclick="event.stopPropagation();Cart.add(${p.id})">
          &#43; Add to Cart
        </button>
      </div>
    </div>`;
}
