// ==================================================
// MÓDULO DE AUTENTICAÇÃO DO FRONTEND
// ==================================================

const getAuthToken = (role) => {
  return role === 'admin' ? localStorage.getItem('adminToken') : localStorage.getItem('driverToken');
};

const getAuthHeaders = (role, isMultipart = false) => {
  const token = getAuthToken(role);
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const checkAuth = (role) => {
  const token = getAuthToken(role);
  if (!token) {
    console.warn(`[Auth] Token ausente para a role ${role}. Redirecionando para o login...`);
    const loginPage = role === 'admin' ? 'login.html' : 'login-motorista.html';
    window.location.href = loginPage;
    return false;
  }
  return true;
};

const handleLogin = async (e, role) => {
  e.preventDefault();
  
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!email || !password) {
    if (window.UI) window.UI.showAlert('Preencha o email e a senha.', 'error');
    return;
  }

  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Autenticando...';

  try {
    const res = await fetch(`${window.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Erro ao efetuar login.');
    }

    if (role === 'admin') {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminName', data.user.nome);
      window.location.href = 'index.html';
    } else {
      localStorage.setItem('driverToken', data.token);
      localStorage.setItem('driverName', data.user.nome);
      window.location.href = 'painel-de-entrega.html';
    }
  } catch (error) {
    if (window.UI) {
      window.UI.showAlert(error.message, 'error');
    } else {
      alert(error.message);
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
};

const handleLogout = async (role) => {
  try {
    await fetch(`${window.API_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(role)
    });
  } catch (err) {
    console.warn('Erro ao chamar logout na API:', err);
  } finally {
    if (role === 'admin') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminName');
      window.location.href = 'login.html';
    } else {
      localStorage.removeItem('driverToken');
      localStorage.removeItem('driverName');
      window.location.href = 'login-motorista.html';
    }
  }
};

const handle401Safely = (role) => {
  if (window.UI) {
    window.UI.showAlert('A sua sessão expirou. Por favor, faça login novamente.', 'error');
  }
  setTimeout(() => {
    handleLogout(role);
  }, 1500);
};

window.Auth = {
  getAuthToken,
  getAuthHeaders,
  checkAuth,
  handleLogin,
  handleLogout,
  handle401Safely
};
