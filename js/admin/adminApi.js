// ==================================================
// MÓDULO DE API DO ADMINISTRADOR (adminApi.js)
// ==================================================

const AdminApi = {
  // --- STATS ---
  fetchStats: async () => {
    const res = await fetch(`${window.API_URL}/stats/overview`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) {
      if (res.status === 401) window.Auth.handle401Safely('admin');
      throw new Error('Erro ao carregar estatísticas gerais.');
    }
    return res.json();
  },

  fetchServicesStats: async () => {
    const res = await fetch(`${window.API_URL}/stats/services`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar estatísticas de serviços.');
    return res.json();
  },

  fetchFinancialStats: async () => {
    const res = await fetch(`${window.API_URL}/stats/financials`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar finanças.');
    return res.json();
  },

  // --- ORDERS ---
  fetchActiveOrders: async () => {
    const res = await fetch(`${window.API_URL}/orders/active`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar entregas ativas.');
    return res.json();
  },

  fetchHistoryOrders: async () => {
    const res = await fetch(`${window.API_URL}/orders/history`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar histórico.');
    return res.json();
  },

  createOrder: async (formData) => {
    const res = await fetch(`${window.API_URL}/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${window.Auth.getAuthToken('admin')}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao criar a entrega.');
    return data;
  },

  assignOrder: async (orderId, driverId) => {
    const res = await fetch(`${window.API_URL}/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: window.Auth.getAuthHeaders('admin'),
      body: JSON.stringify({ driverId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao atribuir motorista.');
    return data;
  },

  cancelOrder: async (orderId, reason) => {
    const res = await fetch(`${window.API_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: window.Auth.getAuthHeaders('admin'),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao cancelar a entrega.');
    return data;
  },

  // --- DRIVERS ---
  fetchDrivers: async () => {
    const res = await fetch(`${window.API_URL}/drivers`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar motoristas.');
    return res.json();
  },

  fetchAvailableDrivers: async () => {
    const res = await fetch(`${window.API_URL}/drivers/available`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar motoristas disponíveis.');
    return res.json();
  },

  createDriver: async (driverData) => {
    const res = await fetch(`${window.API_URL}/auth/register-driver`, {
      method: 'POST',
      headers: window.Auth.getAuthHeaders('admin'),
      body: JSON.stringify(driverData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao registar motorista.');
    return data;
  },

  fetchDriverReport: async (driverId) => {
    const res = await fetch(`${window.API_URL}/drivers/${driverId}/report`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar relatório do motorista.');
    return res.json();
  },

  fetchDriverTrips: async (driverId) => {
    const res = await fetch(`${window.API_URL}/admin/drivers/${driverId}/trips`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar viagens do motorista.');
    return res.json();
  },

  // --- CLIENTS ---
  fetchClients: async () => {
    const res = await fetch(`${window.API_URL}/clients`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar clientes.');
    return res.json();
  },

  createClient: async (clientData) => {
    const res = await fetch(`${window.API_URL}/clients`, {
      method: 'POST',
      headers: window.Auth.getAuthHeaders('admin'),
      body: JSON.stringify(clientData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao criar cliente.');
    return data;
  },

  fetchClientStatement: async (clientId, startDate, endDate) => {
    let url = `${window.API_URL}/clients/${clientId}/statement`;
    if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;
    const res = await fetch(url, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar extrato do cliente.');
    return res.json();
  },

  // --- COSTS ---
  fetchCosts: async () => {
    const res = await fetch(`${window.API_URL}/costs`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar custos.');
    return res.json();
  },

  fetchCostsSummary: async () => {
    const res = await fetch(`${window.API_URL}/costs/dashboard-summary?months=6`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar resumo de custos.');
    return res.json();
  },

  createCost: async (costData) => {
    const res = await fetch(`${window.API_URL}/costs`, {
      method: 'POST',
      headers: window.Auth.getAuthHeaders('admin'),
      body: JSON.stringify(costData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao registar custo.');
    return data;
  },

  // --- MANAGERS ---
  fetchManagers: async () => {
    const res = await fetch(`${window.API_URL}/managers`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar gestores.');
    return res.json();
  },

  createManager: async (managerData) => {
    const res = await fetch(`${window.API_URL}/managers`, {
      method: 'POST',
      headers: window.Auth.getAuthHeaders('admin'),
      body: JSON.stringify(managerData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao criar gestor.');
    return data;
  },

  updateManager: async (id, managerData) => {
    const res = await fetch(`${window.API_URL}/managers/${id}`, {
      method: 'PUT',
      headers: window.Auth.getAuthHeaders('admin'),
      body: JSON.stringify(managerData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao atualizar gestor.');
    return data;
  },

  deleteManager: async (id) => {
    const res = await fetch(`${window.API_URL}/managers/${id}`, {
      method: 'DELETE',
      headers: window.Auth.getAuthHeaders('admin')
    });
    if (!res.ok) throw new Error('Erro ao remover gestor.');
    return res.json();
  },

  // --- EXPENSES ---
  fetchExpenses: async () => {
    const res = await fetch(`${window.API_URL}/expenses`, { headers: window.Auth.getAuthHeaders('admin') });
    if (!res.ok) throw new Error('Erro ao carregar despesas.');
    return res.json();
  },

  createExpense: async (expenseData) => {
    const res = await fetch(`${window.API_URL}/expenses`, {
      method: 'POST',
      headers: window.Auth.getAuthHeaders('admin'),
      body: JSON.stringify(expenseData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao lançar despesa.');
    return data;
  },

  updateExpense: async (id, expenseData) => {
    const res = await fetch(`${window.API_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: window.Auth.getAuthHeaders('admin'),
      body: JSON.stringify(expenseData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao atualizar despesa.');
    return data;
  },

  deleteExpense: async (id) => {
    const res = await fetch(`${window.API_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: window.Auth.getAuthHeaders('admin')
    });
    if (!res.ok) throw new Error('Erro ao remover despesa.');
    return res.json();
  },

  // --- ADMIN ---
  deleteHistory: async () => {
    const res = await fetch(`${window.API_URL}/admin/orders/history`, {
      method: 'DELETE',
      headers: window.Auth.getAuthHeaders('admin')
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao limpar histórico.');
    return data;
  }
};

window.AdminApi = AdminApi;
