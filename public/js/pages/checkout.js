async function renderCheckout() {
  const root = document.getElementById('app-root');
  if (!Auth.user) { app.navigate('login'); return; }
  root.innerHTML = '<div class="page"><div class="loader-ring" style="margin:80px auto"></div></div>';
  try {
    const cart = await API.get('/cart');
    if (cart.items.length === 0) { app.navigate('cart'); return; }
    root.innerHTML = `
      <div class="page" style="max-width:800px">
        <h1 class="section-title" style="margin-bottom:32px">Checkout</h1>
        <div id="checkout-error"></div>
        <div style="display:grid;gap:24px">
          <div class="card">
            <h3 style="margin-bottom:20px;font-family:'Outfit',sans-serif">Shipping Address</h3>
            <div class="form-row">
              <div class="form-group"><label>Street Address</label><input id="street" class="form-control" placeholder="123 Main St" /></div>
              <div class="form-group"><label>City</label><input id="city" class="form-control" placeholder="New York" /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>State</label><input id="state" class="form-control" placeholder="NY" /></div>
              <div class="form-group"><label>ZIP Code</label><input id="zip" class="form-control" placeholder="10001" /></div>
            </div>
            <div class="form-group"><label>Country</label><input id="country" class="form-control" value="USA" /></div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:20px;font-family:'Outfit',sans-serif">Payment Method</h3>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:14px 20px;background:var(--bg3);border:2px solid var(--accent);border-radius:10px;font-weight:600">
                <input type="radio" name="payment" value="card" checked> &#128179; Credit/Debit Card
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:14px 20px;background:var(--bg3);border:2px solid var(--border);border-radius:10px;font-weight:600">
                <input type="radio" name="payment" value="paypal"> &#128176; PayPal
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:14px 20px;background:var(--bg3);border:2px solid var(--border);border-radius:10px;font-weight:600">
                <input type="radio" name="payment" value="cod"> &#128230; Cash on Delivery
              </label>
            </div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:16px;font-family:'Outfit',sans-serif">Order Summary</h3>
            ${cart.items.map(i => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:.9rem">
                <span>${i.name} x${i.quantity}</span>
                <span style="font-weight:600">&#8377;${(i.price * i.quantity).toLocaleString('en-IN')}</span>
              </div>`).join('')}
            <div style="display:flex;justify-content:space-between;margin-top:16px;font-size:1.15rem;font-weight:800">
              <span>Total</span><span style="color:var(--accent)">&#8377;${cart.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button class="btn-primary" style="padding:16px;font-size:1.05rem;width:100%" onclick="placeOrder()">
            &#128722; Place Order — &#8377;${cart.total.toLocaleString('en-IN')}
          </button>
        </div>
      </div>`;
  } catch (e) { root.innerHTML = '<div class="page"><div class="alert alert-error">' + e.message + '</div></div>'; }
}

async function placeOrder() {
  const street = document.getElementById('street').value.trim();
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const zip = document.getElementById('zip').value.trim();
  const country = document.getElementById('country').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'card';
  const errEl = document.getElementById('checkout-error');

  if (!street || !city || !state || !zip) {
    errEl.innerHTML = '<div class="alert alert-error">Please fill in all shipping fields</div>';
    return;
  }

  try {
    const order = await API.post('/orders/checkout', {
      shipping_address: { street, city, state, zip, country },
      payment_method: payment
    });
    await Cart.loadCount();
    app.navigate('order-success', { orderId: order.order.id });
  } catch (e) {
    errEl.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

function renderOrderSuccess(params = {}) {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="page" style="text-align:center;padding:80px 24px">
      <div style="font-size:5rem;margin-bottom:24px">&#127881;</div>
      <h1 style="font-family:'Outfit',sans-serif;font-size:2.5rem;margin-bottom:16px">Order Placed!</h1>
      <p style="color:var(--text2);font-size:1.1rem;margin-bottom:32px">Your order #${params.orderId} has been placed successfully. You'll receive a confirmation soon.</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
        <button class="btn-primary" style="padding:14px 28px" onclick="app.navigate('orders')">View My Orders</button>
        <button class="btn-secondary" style="padding:14px 28px" onclick="app.navigate('products')">Continue Shopping</button>
      </div>
    </div>`;
}
