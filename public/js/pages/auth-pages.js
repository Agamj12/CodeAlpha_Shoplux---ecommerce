function renderLoginPage() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div style="min-height:calc(100vh - 68px);display:flex;align-items:center;justify-content:center;padding:40px 24px">
      <div class="card" style="width:100%;max-width:440px">
        <div style="text-align:center;margin-bottom:32px">
          <div style="font-size:2.5rem;margin-bottom:12px">&#128274;</div>
          <h1 style="font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800">Welcome Back</h1>
          <p style="color:var(--text2);margin-top:6px">Sign in to your account</p>
        </div>
        <div id="login-error"></div>
        <div class="form-group"><label>Email</label><input id="login-email" class="form-control" type="email" placeholder="you@example.com" /></div>
        <div class="form-group"><label>Password</label><input id="login-password" class="form-control" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()" /></div>
        <button class="btn-primary" style="width:100%;padding:14px;font-size:1rem" onclick="doLogin()">Sign In</button>
        <p style="text-align:center;margin-top:20px;color:var(--text2);font-size:.9rem">
          Don't have an account? <a onclick="app.navigate('register')" style="color:var(--accent);cursor:pointer;font-weight:600">Create one</a>
        </p>
        <div style="margin-top:20px;padding:14px;background:var(--bg3);border-radius:8px;font-size:.85rem;color:var(--text2)">
          <strong>Demo accounts:</strong><br>
          Admin: admin@shop.com / admin123<br>
          User: john@example.com / user123
        </div>
      </div>
    </div>`;
}

async function doLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  try {
    const data = await API.post('/auth/login', { email, password });
    Auth.set(data.token, data.user);
    await Cart.loadCount();
    Toast.show('Welcome back, ' + data.user.name + '!', 'success');
    app.navigate('home');
  } catch (e) {
    errEl.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

function renderRegisterPage() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div style="min-height:calc(100vh - 68px);display:flex;align-items:center;justify-content:center;padding:40px 24px">
      <div class="card" style="width:100%;max-width:440px">
        <div style="text-align:center;margin-bottom:32px">
          <div style="font-size:2.5rem;margin-bottom:12px">&#127881;</div>
          <h1 style="font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800">Create Account</h1>
          <p style="color:var(--text2);margin-top:6px">Join thousands of happy shoppers</p>
        </div>
        <div id="register-error"></div>
        <div class="form-group"><label>Full Name</label><input id="reg-name" class="form-control" placeholder="John Doe" /></div>
        <div class="form-group"><label>Email</label><input id="reg-email" class="form-control" type="email" placeholder="you@example.com" /></div>
        <div class="form-group"><label>Password</label><input id="reg-password" class="form-control" type="password" placeholder="Min 6 characters" onkeydown="if(event.key==='Enter')doRegister()" /></div>
        <button class="btn-primary" style="width:100%;padding:14px;font-size:1rem" onclick="doRegister()">Create Account</button>
        <p style="text-align:center;margin-top:20px;color:var(--text2);font-size:.9rem">
          Already have an account? <a onclick="app.navigate('login')" style="color:var(--accent);cursor:pointer;font-weight:600">Sign in</a>
        </p>
      </div>
    </div>`;
}

async function doRegister() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('register-error');
  try {
    const data = await API.post('/auth/register', { name, email, password });
    Auth.set(data.token, data.user);
    await Cart.loadCount();
    Toast.show('Account created! Welcome, ' + data.user.name + '!', 'success');
    app.navigate('home');
  } catch (e) {
    errEl.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}
