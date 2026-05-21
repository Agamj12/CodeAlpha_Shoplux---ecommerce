async function renderDashboard() {
  const root = document.getElementById('app-root');
  if (!Auth.user || Auth.user.role !== 'admin') { app.navigate('home'); return; }
  root.innerHTML = '<div class="page"><div class="loader-ring" style="margin:80px auto"></div></div>';
  try {
    const stats = await API.get('/dashboard/stats');
    const { overview, orderStatus, recentOrders, topProducts, revenueByMonth, lowStockProducts } = stats;
    root.innerHTML = `
      <div class="page">
        <h1 class="section-title" style="margin-bottom:32px">Admin <span>Dashboard</span></h1>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon" style="background:rgba(108,99,255,.15)">&#128176;</div><div class="stat-info"><div class="value">&#8377;${overview.totalRevenue.toLocaleString('en-IN')}</div><div class="label">Total Revenue</div></div></div>
          <div class="stat-card"><div class="stat-icon" style="background:rgba(67,217,173,.15)">&#128230;</div><div class="stat-info"><div class="value">${overview.totalOrders}</div><div class="label">Total Orders</div></div></div>
          <div class="stat-card"><div class="stat-icon" style="background:rgba(255,101,132,.15)">&#128100;</div><div class="stat-info"><div class="value">${overview.totalUsers}</div><div class="label">Total Users</div></div></div>
          <div class="stat-card"><div class="stat-icon" style="background:rgba(255,179,71,.15)">&#128722;</div><div class="stat-info"><div class="value">${overview.totalProducts}</div><div class="label">Products</div></div></div>
        </div>
        <div class="tab-bar" id="dash-tabs" style="margin-bottom:28px">
          <button class="tab-btn active" onclick="dashTab('overview',this)">Overview</button>
          <button class="tab-btn" onclick="dashTab('orders',this)">Orders</button>
          <button class="tab-btn" onclick="dashTab('products-admin',this)">Products</button>
          <button class="tab-btn" onclick="dashTab('users-admin',this)">Users</button>
        </div>
        <div id="dash-content">
          ${renderOverviewTab(recentOrders, topProducts, revenueByMonth, lowStockProducts, orderStatus)}
        </div>
      </div>`;
  } catch (e) { root.innerHTML = `<div class="page"><div class="alert alert-error">${e.message}</div></div>`; }
}

function renderOverviewTab(recentOrders, topProducts, revenueByMonth, lowStockProducts, orderStatus) {
  const maxRev = Math.max(...revenueByMonth.map(r => r.revenue || 0), 1);
  const statusBadge = s => `<span class="badge badge-${s}">${s}</span>`;
  return `
    <div class="dashboard-grid">
      <div class="card">
        <h3 style="margin-bottom:16px;font-family:'Outfit',sans-serif">Revenue (6 months)</h3>
        <div class="chart-bar">
          ${revenueByMonth.map(m => `
            <div class="bar-wrap">
              <div class="bar" style="height:${Math.round((m.revenue / maxRev) * 100)}%"></div>
              <div class="bar-label">${m.month ? m.month.slice(5) : ''}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:16px;font-family:'Outfit',sans-serif">Order Status</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[['pending','&#128337;',orderStatus.pendingOrders],['processing','&#9881;',orderStatus.processingOrders],['shipped','&#128666;',orderStatus.shippedOrders],['delivered','&#10003;',orderStatus.deliveredOrders]].map(([s,icon,count]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg3);border-radius:8px">
              <span>${icon} ${s.charAt(0).toUpperCase()+s.slice(1)}</span>
              <span style="font-weight:700">${count}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="card full-width">
        <h3 style="margin-bottom:16px;font-family:'Outfit',sans-serif">Recent Orders</h3>
        <table class="table">
          <thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            ${recentOrders.map(o => `
              <tr>
                <td>#${o.id}</td>
                <td>${o.user_name}</td>
                <td style="color:var(--accent);font-weight:700">&#8377;${o.total.toLocaleString('en-IN')}</td>
                <td>${statusBadge(o.status)}</td>
                <td style="color:var(--text2)">${new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <select class="form-control" style="width:130px;padding:6px" onchange="updateOrderStatus(${o.id},this.value)">
                    ${['pending','processing','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}
                  </select>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${lowStockProducts.length ? `
        <div class="card">
          <h3 style="margin-bottom:16px;font-family:'Outfit',sans-serif;color:var(--warn)">&#9888; Low Stock Alert</h3>
          ${lowStockProducts.map(p => `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:.9rem">
              <span>${p.name}</span>
              <span style="color:var(--warn);font-weight:700">${p.stock} left</span>
            </div>`).join('')}
        </div>` : ''}
      <div class="card">
        <h3 style="margin-bottom:16px;font-family:'Outfit',sans-serif">Top Products</h3>
        ${topProducts.map((p,i) => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text2);font-weight:700;width:20px">${i+1}</span>
            <div style="flex:1;font-size:.9rem"><div style="font-weight:600">${p.name}</div><div style="color:var(--text2)">${p.sold} sold</div></div>
            <span style="color:var(--accent);font-weight:700">&#8377;${(p.revenue || 0).toLocaleString('en-IN')}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

async function dashTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const content = document.getElementById('dash-content');
  if (!content) return;
  content.innerHTML = '<div class="loader-ring" style="margin:40px auto"></div>';
  if (tab === 'overview') {
    const s = await API.get('/dashboard/stats');
    content.innerHTML = renderOverviewTab(s.recentOrders, s.topProducts, s.revenueByMonth, s.lowStockProducts, s.orderStatus);
  } else if (tab === 'orders') {
    const data = await API.get('/orders?limit=50');
    const statusBadge = s => `<span class="badge badge-${s}">${s}</span>`;
    content.innerHTML = `<div class="card"><table class="table"><thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Items</th><th>Status</th><th>Date</th><th>Update</th></tr></thead><tbody>
      ${data.orders.map(o => `<tr><td>#${o.id}</td><td>${o.user_name}</td><td style="color:var(--accent);font-weight:700">&#8377;${o.total.toLocaleString('en-IN')}</td><td>${o.items_count}</td><td>${statusBadge(o.status)}</td><td style="color:var(--text2)">${new Date(o.created_at).toLocaleDateString()}</td>
        <td><select class="form-control" style="width:130px;padding:6px" onchange="updateOrderStatus(${o.id},this.value)">${['pending','processing','shipped','delivered','cancelled'].map(s=>`<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')}
      </tbody></table></div>`;
  } else if (tab === 'products-admin') {
    await renderAdminProducts(content);
  } else if (tab === 'users-admin') {
    await renderAdminUsers(content);
  }
}

async function renderAdminProducts(container) {
  const data = await API.get('/products?limit=50');
  container.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="btn-primary" onclick="showAddProduct()">+ Add Product</button>
    </div>
    <div class="card">
      <table class="table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
        ${data.products.map(p => `<tr>
          <td style="font-weight:600">${p.name}</td>
          <td style="color:var(--text2)">${p.category_name || '-'}</td>
          <td style="color:var(--accent);font-weight:700">&#8377;${p.price.toLocaleString('en-IN')}</td>
          <td><span style="color:${p.stock < 10 ? 'var(--warn)' : 'var(--success)'};font-weight:600">${p.stock}</span></td>
          <td><button class="btn-danger" style="padding:6px 12px;font-size:.8rem" onclick="deleteProduct(${p.id})">Delete</button></td>
        </tr>`).join('')}
      </tbody></table>
    </div>`;
}

async function renderAdminUsers(container) {
  const data = await API.get('/dashboard/users?limit=50');
  container.innerHTML = `<div class="card"><table class="table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead><tbody>
    ${data.users.map(u => `<tr>
      <td style="font-weight:600">${u.name}</td>
      <td style="color:var(--text2)">${u.email}</td>
      <td><span class="badge ${u.role==='admin'?'badge-processing':'badge-delivered'}">${u.role}</span></td>
      <td style="color:var(--text2)">${new Date(u.created_at).toLocaleDateString()}</td>
      <td><button class="btn-secondary" style="padding:6px 14px;font-size:.8rem" onclick="toggleRole(${u.id},'${u.role==='admin'?'customer':'admin'}')">${u.role==='admin'?'Demote':'Promote'}</button></td>
    </tr>`).join('')}
  </tbody></table></div>`;
}

async function updateOrderStatus(id, status) {
  try { await API.put('/orders/' + id + '/status', { status }); Toast.show('Status updated', 'success'); }
  catch (e) { Toast.show(e.message, 'error'); }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try { await API.delete('/products/' + id); Toast.show('Product deleted', 'success'); renderDashboard(); }
  catch (e) { Toast.show(e.message, 'error'); }
}

async function toggleRole(id, role) {
  try { await API.put('/dashboard/users/' + id + '/role', { role }); Toast.show('Role updated', 'success'); renderDashboard(); }
  catch (e) { Toast.show(e.message, 'error'); }
}

function showAddProduct() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'product-modal';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h2 style="font-family:'Outfit',sans-serif">Add Product</h2><button class="close-btn" onclick="document.getElementById('product-modal').remove()">&#10005;</button></div>
      <div id="add-product-error"></div>
      <div class="form-group"><label>Name</label><input id="ap-name" class="form-control" /></div>
      <div class="form-group"><label>Description</label><textarea id="ap-desc" class="form-control" rows="3"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Price (&#8377;)</label><input id="ap-price" class="form-control" type="number" step="1" /></div>
        <div class="form-group"><label>Original Price</label><input id="ap-orig" class="form-control" type="number" step="0.01" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Stock</label><input id="ap-stock" class="form-control" type="number" value="0" /></div>
        <div class="form-group"><label>Featured</label><select id="ap-featured" class="form-control"><option value="0">No</option><option value="1">Yes</option></select></div>
      </div>
      <div class="form-group"><label>Image URL</label><input id="ap-image" class="form-control" placeholder="https://..." /></div>
      <button class="btn-primary" style="width:100%;padding:12px" onclick="submitAddProduct()">Add Product</button>
    </div>`;
  document.body.appendChild(overlay);
}

async function submitAddProduct() {
  const body = {
    name: document.getElementById('ap-name').value,
    description: document.getElementById('ap-desc').value,
    price: parseFloat(document.getElementById('ap-price').value),
    original_price: parseFloat(document.getElementById('ap-orig').value) || null,
    stock: parseInt(document.getElementById('ap-stock').value) || 0,
    image: document.getElementById('ap-image').value,
    featured: parseInt(document.getElementById('ap-featured').value)
  };
  try {
    await API.post('/products', body);
    document.getElementById('product-modal')?.remove();
    Toast.show('Product added!', 'success');
    renderDashboard();
  } catch (e) {
    document.getElementById('add-product-error').innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}
