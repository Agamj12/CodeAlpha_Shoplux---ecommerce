const Auth = {
  user: null,
  init() {
    const u = localStorage.getItem('user');
    if (u) this.user = JSON.parse(u);
    this.render();
  },
  set(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.user = user;
    this.render();
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.user = null;
    this.render();
    Cart.count = 0;
    Cart.render();
    app.navigate('home');
    Toast.show('Logged out successfully', 'info');
  },
  render() {
    const el = document.getElementById('nav-user');
    if (!el) return;
    if (this.user) {
      const isAdmin = this.user.role === 'admin';
      el.innerHTML = `
        <div class="nav-user-menu" id="user-menu-wrap">
          <div class="avatar-circle" style="background:${this.user.avatar || '#6c63ff'}" onclick="Auth.toggleMenu()">
            ${this.user.name[0].toUpperCase()}
          </div>
          <div class="user-dropdown hidden" id="user-dropdown">
            <div style="padding:8px 12px;font-weight:600;border-bottom:1px solid var(--border);margin-bottom:4px">${this.user.name}</div>
            <button class="dropdown-item" onclick="app.navigate('profile');Auth.closeMenu()">&#128100; Profile</button>
            <button class="dropdown-item" onclick="app.navigate('orders');Auth.closeMenu()">&#128230; My Orders</button>
            ${isAdmin ? '<button class="dropdown-item" onclick="app.navigate(\'dashboard\');Auth.closeMenu()">&#128202; Dashboard</button>' : ''}
            <button class="dropdown-item" onclick="Auth.logout()" style="color:var(--danger)">&#128682; Logout</button>
          </div>
        </div>`;
    } else {
      el.innerHTML = '<button class="btn-primary" onclick="app.navigate(\'login\')">Sign In</button>';
    }
  },
  toggleMenu() {
    const d = document.getElementById('user-dropdown');
    if (d) d.classList.toggle('hidden');
  },
  closeMenu() {
    const d = document.getElementById('user-dropdown');
    if (d) d.classList.add('hidden');
  }
};
document.addEventListener('click', e => {
  const menu = document.getElementById('user-menu-wrap');
  if (menu && !menu.contains(e.target)) Auth.closeMenu();
});
