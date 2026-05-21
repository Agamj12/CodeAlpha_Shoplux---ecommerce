const Toast = {
  show(msg, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || (() => {
      const d = document.createElement('div');
      d.id = 'toast-container';
      d.className = 'toast-container';
      document.body.appendChild(d);
      return d;
    })();
    const icons = { success: '&#10004;', error: '&#10008;', info: '&#9432;' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; setTimeout(() => t.remove(), 300); }, duration);
  }
};

const Cart = {
  count: 0,
  async loadCount() {
    if (!Auth.user) { this.count = 0; this.render(); return; }
    try {
      const data = await API.get('/cart');
      this.count = data.count || 0;
      this.render();
    } catch (e) {}
  },
  render() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = this.count;
  },
  async add(productId, qty = 1) {
    if (!Auth.user) { app.navigate('login'); Toast.show('Please login to add items', 'info'); return; }
    try {
      await API.post('/cart/add', { product_id: productId, quantity: qty });
      this.count += qty;
      this.render();
      Toast.show('Added to cart!', 'success');
    } catch (e) { Toast.show(e.message, 'error'); }
  }
};
