async function renderProductDetail(params = {}) {
  const root = document.getElementById('app-root');
  root.innerHTML = '<div class="page"><div class="loader-ring" style="margin:80px auto"></div></div>';
  try {
    const p = await API.get('/products/' + params.id);
    const discount = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
    const stars = n => '&#9733;'.repeat(n) + '&#9734;'.repeat(5 - n);
    root.innerHTML = `
      <div class="page">
        <div style="margin-bottom:16px;color:var(--text2);font-size:.9rem">
          <a onclick="app.navigate('home')" style="cursor:pointer;color:var(--accent)">Home</a> &#8250;
          <a onclick="app.navigate('products',{category:'${p.category_name}'})" style="cursor:pointer;color:var(--accent)">${p.category_name}</a> &#8250; ${p.name}
        </div>
        <div class="product-detail">
          <div>
            ${p.image ? `<img class="product-detail-img" src="${p.image}" alt="${p.name}">` : `<div class="product-img-placeholder" style="height:400px;border-radius:12px">${p.category_icon || '&#128230;'}</div>`}
          </div>
          <div class="product-detail-info">
            <div style="color:var(--accent);font-weight:600;font-size:.9rem">${p.category_name}</div>
            <h1 style="font-size:1.8rem;font-weight:800;font-family:'Outfit',sans-serif">${p.name}</h1>
            <div class="product-rating">
              <span class="stars">${stars(Math.round(p.rating || 0))}</span>
              <span>${p.rating} (${p.reviews_count} reviews)</span>
            </div>
            <div class="product-price-row" style="margin:0">
              <span class="product-price" style="font-size:2rem">&#8377;${p.price.toLocaleString('en-IN')}</span>
              ${p.original_price ? `<span class="product-original" style="font-size:1.1rem">&#8377;${p.original_price.toLocaleString('en-IN')}</span><span class="product-discount" style="font-size:.9rem">-${discount}%</span>` : ''}
            </div>
            <p style="color:var(--text2);line-height:1.8">${p.description || ''}</p>
            <div style="display:flex;align-items:center;gap:12px">
              <span style="color:${p.stock > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:600">
                ${p.stock > 0 ? '&#10003; In Stock (' + p.stock + ' left)' : '&#10007; Out of Stock'}
              </span>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:8px">
                <label style="font-weight:600">Qty:</label>
                <input type="number" id="qty-input" value="1" min="1" max="${p.stock}" class="form-control" style="width:80px">
              </div>
              <button class="btn-primary" style="padding:12px 28px;font-size:1rem" onclick="addToCartDetail(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>
                &#43; Add to Cart
              </button>
              <button class="btn-secondary" style="padding:12px 28px" onclick="app.navigate('cart')">View Cart</button>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:40px">
          <h2 style="margin-bottom:24px;font-family:'Outfit',sans-serif">Reviews (${p.reviews_count})</h2>
          ${Auth.user ? `
            <div style="background:var(--bg3);border-radius:12px;padding:20px;margin-bottom:24px">
              <h3 style="margin-bottom:16px;font-size:1rem">Write a Review</h3>
              <div id="stars-input" style="display:flex;gap:8px;margin-bottom:12px;font-size:1.5rem">
                ${[1,2,3,4,5].map(n => `<span style="cursor:pointer" onclick="setRating(${n})" id="star-${n}">&#9734;</span>`).join('')}
              </div>
              <textarea id="review-comment" class="form-control" rows="3" placeholder="Share your experience..." style="margin-bottom:12px"></textarea>
              <button class="btn-primary" onclick="submitReview(${p.id})">Submit Review</button>
            </div>` : `<p style="color:var(--text2);margin-bottom:24px"><a onclick="app.navigate('login')" style="color:var(--accent);cursor:pointer">Sign in</a> to write a review</p>`}
          <div class="reviews-list">
            ${p.reviews.length ? p.reviews.map(r => `
              <div class="review-item">
                <div class="review-header">
                  <div class="avatar-circle" style="background:${r.user_avatar || '#6c63ff'};width:36px;height:36px;font-size:.85rem">${r.user_name[0].toUpperCase()}</div>
                  <div><div style="font-weight:600">${r.user_name}</div>
                  <div class="review-meta"><span class="stars">${stars(r.rating)}</span> &bull; ${new Date(r.created_at).toLocaleDateString()}</div></div>
                </div>
                <p style="color:var(--text2);line-height:1.6">${r.comment || ''}</p>
              </div>`).join('') : '<p style="color:var(--text2)">No reviews yet. Be the first!</p>'}
          </div>
        </div>
      </div>`;
    window._productRating = 0;
  } catch (e) {
    root.innerHTML = '<div class="page empty-state"><div class="icon">&#9888;</div><h3>Product not found</h3></div>';
  }
}

function setRating(n) {
  window._productRating = n;
  [1,2,3,4,5].forEach(i => {
    const s = document.getElementById('star-' + i);
    if (s) s.innerHTML = i <= n ? '&#9733;' : '&#9734;';
  });
}

function addToCartDetail(id) {
  const qty = parseInt(document.getElementById('qty-input').value) || 1;
  Cart.add(id, qty);
}

async function submitReview(productId) {
  const rating = window._productRating;
  const comment = document.getElementById('review-comment').value;
  if (!rating) { Toast.show('Please select a rating', 'error'); return; }
  try {
    await API.post('/products/' + productId + '/reviews', { rating, comment });
    Toast.show('Review submitted!', 'success');
    renderProductDetail({ id: productId });
  } catch (e) { Toast.show(e.message, 'error'); }
}
