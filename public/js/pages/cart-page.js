async function renderCartPage() {
  const root = document.getElementById('app-root');
  if (!Auth.user) { app.navigate('login'); return; }
  root.innerHTML = '<div class="page"><div class="loader-ring" style="margin:80px auto"></div></div>';
  try {
    const cart = await API.get('/cart');
    if (cart.items.length === 0) {
      root.innerHTML = `
        <div class="page">
          <h1 class="section-title" style="margin-bottom:40px">Shopping <span>Cart</span></h1>
          <div class="empty-state">
            <div class="icon">&#128717;</div>
            <h3>Your cart is empty</h3>
            <p>Add some products to get started</p>
            <button class="btn-primary" style="margin-top:20px;padding:12px 28px" onclick="app.navigate('products')">Start Shopping</button>
          </div>
        </div>`;
      return;
    }
    root.innerHTML = `
      <div class="page">
        <h1 class="section-title" style="margin-bottom:32px">Shopping <span>Cart</span></h1>
        <div class="cart-page">
          <div class="cart-items" id="cart-items">${cart.items.map(renderCartItem).join('')}</div>
          <div class="order-summary">
            <h3 style="margin-bottom:20px;font-family:'Outfit',sans-serif">Order Summary</h3>
            <div class="summary-row"><span>Subtotal</span><span>&#8377;${cart.total.toLocaleString('en-IN')}</span></div>
            <div class="summary-row"><span>Shipping</span><span style="color:var(--success)">Free</span></div>
            <div class="summary-row"><span>Total</span><span style="color:var(--accent)">&#8377;${cart.total.toLocaleString('en-IN')}</span></div>
            <button class="btn-primary" style="width:100%;padding:14px;font-size:1rem;margin-top:16px" onclick="app.navigate('checkout')">
              Proceed to Checkout &#8594;
            </button>
            <button class="btn-secondary" style="width:100%;padding:12px;margin-top:8px" onclick="app.navigate('products')">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>`;
  } catch (e) { root.innerHTML = '<div class="page"><div class="alert alert-error">' + e.message + '</div></div>'; }
}

function renderCartItem(item) {
  return `
    <div class="cart-item" id="cart-item-${item.id}">
      <img src="${item.image || ''}" alt="${item.name}" onerror="this.src=''" style="background:var(--bg3);width:80px;height:80px;object-fit:cover;border-radius:8px">
      <div style="flex:1">
        <div style="font-weight:700;margin-bottom:4px">${item.name}</div>
        <div style="color:var(--accent);font-weight:700;font-size:1.05rem">&#8377;${(item.price * item.quantity).toLocaleString('en-IN')}</div>
        <div style="color:var(--text2);font-size:.85rem">&#8377;${item.price.toLocaleString('en-IN')} each</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="updateQty(${item.id}, ${item.quantity - 1})">&#8722;</button>
        <span style="font-weight:700;min-width:20px;text-align:center">${item.quantity}</span>
        <button class="qty-btn" onclick="updateQty(${item.id}, ${item.quantity + 1})">&#43;</button>
      </div>
      <button onclick="removeItem(${item.id})" style="background:none;color:var(--danger);font-size:1.2rem;padding:8px">&#10005;</button>
    </div>`;
}

async function updateQty(id, qty) {
  if (qty < 1) { removeItem(id); return; }
  try {
    await API.put('/cart/' + id, { quantity: qty });
    await renderCartPage();
    await Cart.loadCount();
  } catch (e) { Toast.show(e.message, 'error'); }
}

async function removeItem(id) {
  try {
    await API.delete('/cart/' + id);
    document.getElementById('cart-item-' + id)?.remove();
    await Cart.loadCount();
    Toast.show('Item removed', 'info');
    const items = document.querySelectorAll('.cart-item');
    if (items.length === 0) renderCartPage();
  } catch (e) { Toast.show(e.message, 'error'); }
}
