async function renderProfile() {
  const root = document.getElementById('app-root');
  if (!Auth.user) { app.navigate('login'); return; }
  try {
    const user = await API.get('/auth/profile');
    root.innerHTML = `
      <div class="page" style="max-width:600px">
        <h1 class="section-title" style="margin-bottom:32px">My <span>Profile</span></h1>
        <div class="card">
          <div style="display:flex;align-items:center;gap:20px;margin-bottom:28px">
            <div class="avatar-circle" style="background:${user.avatar||'#6c63ff'};width:64px;height:64px;font-size:1.5rem">${user.name[0].toUpperCase()}</div>
            <div>
              <div style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:800">${user.name}</div>
              <div style="color:var(--text2)">${user.email}</div>
              <span class="badge ${user.role==='admin'?'badge-processing':'badge-delivered'}" style="margin-top:6px">${user.role}</span>
            </div>
          </div>
          <div id="profile-msg"></div>
          <div class="form-group"><label>Full Name</label><input id="profile-name" class="form-control" value="${user.name}" /></div>
          <hr style="border-color:var(--border);margin:20px 0">
          <h3 style="margin-bottom:16px">Change Password</h3>
          <div class="form-group"><label>Current Password</label><input id="cur-pass" class="form-control" type="password" /></div>
          <div class="form-group"><label>New Password</label><input id="new-pass" class="form-control" type="password" /></div>
          <button class="btn-primary" style="padding:12px 28px" onclick="saveProfile()">Save Changes</button>
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid var(--border)">
            <div style="color:var(--text2);font-size:.85rem">Member since ${new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>
          </div>
        </div>
      </div>`;
  } catch (e) { root.innerHTML = '<div class="page"><div class="alert alert-error">' + e.message + '</div></div>'; }
}

async function saveProfile() {
  const name = document.getElementById('profile-name').value;
  const currentPassword = document.getElementById('cur-pass').value;
  const newPassword = document.getElementById('new-pass').value;
  const msgEl = document.getElementById('profile-msg');
  try {
    const data = await API.put('/auth/profile', { name, currentPassword, newPassword });
    Auth.set(localStorage.getItem('token'), data.user);
    msgEl.innerHTML = '<div class="alert alert-success">Profile updated successfully!</div>';
    setTimeout(() => msgEl.innerHTML = '', 3000);
  } catch (e) {
    msgEl.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}
