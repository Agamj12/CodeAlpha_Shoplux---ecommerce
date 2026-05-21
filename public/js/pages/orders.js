async function renderOrdersPage() {
  const root = document.getElementById('app-root');
  if (!Auth.user) { app.navigate('login'); return; }
  root.innerHTML = '<div class="page"><div class="loader-ring" style="margin:80px auto"></div></div>';
  try {
    const orders = await API.get('/orders/my-orders');
    const statusBadge = s => `<span class="badge badge-${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
    root.innerHTML = `
      <div class="page">
        <h1 class="section-title" style="margin-bottom:32px">My <span>Orders</span></h1>
        ${orders.length === 0 ? `
          <div class="empty-state">
            <div class="icon">&#128230;</div>
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here</p>
            <button class="btn-primary" style="margin-top:20px;padding:12px 28px" onclick="app.navigate('products')">Shop Now</button>
          </div>` : `
          <div style="display:flex;flex-direction:column;gap:16px">
            ${orders.map(o => `
              <div class="card" style="cursor:pointer" onclick="renderOrderDetail(${o.id})">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
                  <div>
                    <div style="font-weight:700;margin-bottom:4px">Order #${o.id}</div>
                    <div style="color:var(--text2);font-size:.85rem">${new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                  <div style="text-align:right">
                    ${statusBadge(o.status)}
                    <div style="font-weight:800;font-size:1.1rem;color:var(--accent);margin-top:4px">&#8377;${o.total.toLocaleString('en-IN')}</div>
                    <div style="color:var(--text2);font-size:.85rem">${o.items_count} item(s)</div>
                  </div>
                </div>
              </div>`).join('')}
          </div>`}
      </div>`;
  } catch (e) { root.innerHTML = `<div class="page"><div class="alert alert-error">${e.message}</div></div>`; }
}

async function renderOrderDetail(id) {
  const root = document.getElementById('app-root');
  root.innerHTML = '<div class="page"><div class="loader-ring" style="margin:80px auto"></div></div>';
  try {
    const o = await API.get('/orders/' + id);
    const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
    const statusBadge = s => `<span class="badge badge-${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
    root.innerHTML = `
      <div class="page" style="max-width:800px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
          <button class="btn-secondary" style="padding:8px 16px" onclick="renderOrdersPage()">&#8592; Back</button>
          <h1 class="section-title">Order <span>#${o.id}</span></h1>
          ${statusBadge(o.status)}
        </div>
        <div style="display:grid;gap:20px">
          <div class="card">
            <h3 style="margin-bottom:16px;font-family:'Outfit',sans-serif">Items</h3>
            ${o.items.map(item => `
              <div style="display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
                <img src="${item.image || ''}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;background:var(--bg3)">
                <div style="flex:1">
                  <div style="font-weight:600">${item.name}</div>
                  <div style="color:var(--text2);font-size:.85rem">Qty: ${item.quantity} x &#8377;${item.price.toLocaleString('en-IN')}</div>
                </div>
                <div style="font-weight:700;color:var(--accent)">&#8377;${(item.quantity * item.price).toLocaleString('en-IN')}</div>
              </div>`).join('')}
            <div style="display:flex;justify-content:space-between;margin-top:16px;font-weight:800;font-size:1.1rem">
              <span>Total</span><span style="color:var(--accent)">&#8377;${o.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:12px;font-family:'Outfit',sans-serif">Shipping Address</h3>
            <p style="color:var(--text2);line-height:1.8">${addr.street}<br>${addr.city}, ${addr.state} ${addr.zip}<br>${addr.country}</p>
          </div>
          <div class="card">
            <div style="display:flex;justify-content:space-between">
              <div><span style="color:var(--text2)">Payment: </span><span style="font-weight:600">${o.payment_method}</span></div>
              <div><span style="color:var(--text2)">Date: </span><span style="font-weight:600">${new Date(o.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      </div>`;
  } catch (e) { Toast.show(e.message, 'error'); renderOrdersPage(); }
}
