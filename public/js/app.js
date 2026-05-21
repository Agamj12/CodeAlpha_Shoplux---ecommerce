const app = {
  currentPage: 'home',
  currentParams: {},

  navigate(page, params = {}) {
    this.currentPage = page;
    this.currentParams = params;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const footer = document.getElementById('site-footer');
    if (footer) footer.style.display = ['home', 'products', 'product'].includes(page) ? '' : '';
    this.render();
  },

  render() {
    const p = this.currentPage;
    const params = this.currentParams;
    if (p === 'home') renderHome();
    else if (p === 'products') renderProductsPage(params);
    else if (p === 'product') renderProductDetail(params);
    else if (p === 'cart') renderCartPage();
    else if (p === 'checkout') renderCheckout();
    else if (p === 'order-success') renderOrderSuccess(params);
    else if (p === 'orders') renderOrdersPage();
    else if (p === 'login') renderLoginPage();
    else if (p === 'register') renderRegisterPage();
    else if (p === 'dashboard') renderDashboard();
    else if (p === 'profile') renderProfile();
    else renderHome();
  },

  toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  },

  handleSearch() {
    const val = document.getElementById('search-input').value.trim();
    if (val) {
      renderProductsPage({ search: val });
      this.currentPage = 'products';
    }
  },

  async init() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Always show current year in footer
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    document.getElementById('search-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') app.handleSearch();
    });

    Auth.init();
    await Cart.loadCount();

    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');

    this.render();
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
