// ==================================================
// APLICAÇÃO ADMINISTRATIVA UNIFICADA (ADMIN APP)
// ==================================================

// ==================================================
// MODULE: adminApi.js
// ==================================================
const AdminApi = {
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

  deleteManager: async (id) => {
    const res = await fetch(`${window.API_URL}/managers/${id}`, {
      method: 'DELETE',
      headers: window.Auth.getAuthHeaders('admin')
    });
    if (!res.ok) throw new Error('Erro ao remover gestor.');
    return res.json();
  },

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

// ==================================================
// MODULE: adminCharts.js
// ==================================================
let servicesChartInstance = null;
let costsChartInstance = null;

const AdminCharts = {
  renderServicesChart: (labels, dataValues) => {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return;

    if (servicesChartInstance) {
      servicesChartInstance.destroy();
    }

    servicesChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: dataValues,
          backgroundColor: ['#2F7A3C', '#3DAA50', '#8DC543', '#C97813', '#F6A226'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  },

  renderCostsChart: (labels, revenue, costs) => {
    const ctx = document.getElementById('costsChart');
    if (!ctx) return;

    if (costsChartInstance) {
      costsChartInstance.destroy();
    }

    costsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Receita Bruta (MZN)',
            data: revenue,
            backgroundColor: '#2F7A3C',
            borderRadius: 4
          },
          {
            label: 'Custos Totais (MZN)',
            data: costs,
            backgroundColor: '#C97813',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } }
        },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }
};

// ==================================================
// MODULE: adminMap.js
// ==================================================
let adminMapInstance = null;
let driverMarkers = {};

const AdminMap = {
  initMap: () => {
    const mapEl = document.getElementById('admin-map');
    if (!mapEl) return;

    // Destruir mapa anterior se existir
    if (adminMapInstance) {
      adminMapInstance.remove();
    }

    // Coordenadas centrais de Maputo
    adminMapInstance = L.map('admin-map').setView([-25.9653, 32.5890], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(adminMapInstance);

    // Carregar localizações ativas via API como fallback inicial
    AdminMap.fetchAndPlotLocations();
  },

  fetchAndPlotLocations: async () => {
    try {
      const res = await fetch(`${window.API_URL}/drivers/live-locations`, { headers: window.Auth.getAuthHeaders('admin') });
      if (res.ok) {
        const data = await res.json();
        AdminMap.updateDriverMarkers(data.drivers);
      }
    } catch (err) {
      console.warn('Erro ao carregar localizações fallback:', err);
    }
  },

  updateDriverMarkers: (drivers) => {
    if (!adminMapInstance) return;

    const currentIds = new Set();

    drivers.forEach(d => {
      if (!d.lat || !d.lng) return;
      currentIds.add(d.driverId.toString());

      const latlng = [d.lat, d.lng];
      const statusText = d.status || 'offline';
      const speed = d.speed ? `${Math.round(d.speed)} km/h` : '0 km/h';

      const popupContent = `
        <div class="text-xs p-1">
          <p class="font-bold text-[#2F7A3C]">${d.driverName}</p>
          <p class="text-gray-600">${d.telefone}</p>
          <p class="mt-1 font-semibold">Status: ${window.UI.getDriverStatusLabel(statusText)}</p>
          <p class="text-gray-500 mt-0.5">Velocidade: ${speed}</p>
        </div>
      `;

      if (driverMarkers[d.driverId]) {
        driverMarkers[d.driverId].setLatLng(latlng);
        driverMarkers[d.driverId].getPopup().setContent(popupContent);
      } else {
        const markerColor = statusText.includes('livre') ? 'green' : statusText.includes('ocupado') ? 'orange' : 'red';
        
        const customIcon = L.divIcon({
          className: 'custom-driver-marker',
          html: `<div class="w-4 h-4 rounded-full bg-${markerColor}-600 border-2 border-white shadow-md animate-pulse"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker(latlng, { icon: customIcon })
          .bindPopup(popupContent)
          .addTo(adminMapInstance);

        driverMarkers[d.driverId] = marker;
      }
    });

    // Remover marcadores de motoristas que ficaram offline
    Object.keys(driverMarkers).forEach(id => {
      if (!currentIds.has(id)) {
        adminMapInstance.removeLayer(driverMarkers[id]);
        delete driverMarkers[id];
      }
    });
  }
};

// ==================================================
// MODULE: adminModals.js
// ==================================================
const AdminModals = {
  openAssignModal: async (orderId) => {
    document.getElementById('assign-order-id').value = orderId;
    window.UI.openModal('modal-assign');

    const selectEl = document.getElementById('assign-driver-select');
    selectEl.innerHTML = '<option value="">Carregando motoristas disponíveis...</option>';

    try {
      const drivers = await AdminApi.fetchAvailableDrivers();
      if (drivers.length === 0) {
        selectEl.innerHTML = '<option value="">Nenhum motorista online e livre no momento</option>';
        return;
      }

      selectEl.innerHTML = '<option value="">Selecione o motorista...</option>';
      drivers.forEach(d => {
        selectEl.innerHTML += `<option value="${d._id}">${d.user.nome} (${d.vehicle_plate || 'Sem Viatura'})</option>`;
      });
    } catch (err) {
      selectEl.innerHTML = '<option value="">Erro ao carregar motoristas</option>';
    }
  },

  submitAssignOrder: async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('assign-order-id').value;
    const driverId = document.getElementById('assign-driver-select').value;

    if (!driverId) {
      window.UI.showAlert('Selecione um motorista.', 'warning');
      return;
    }

    try {
      await AdminApi.assignOrder(orderId, driverId);
      window.UI.showAlert('Entrega atribuída com sucesso!');
      window.UI.closeModal('modal-assign');
      AdminApp.loadActiveOrders();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  openOrderDetails: async (orderId) => {
    // Buscar todas as encomendas da tabela ativa ou do histórico
    try {
      const res = await fetch(`${window.API_URL}/orders/${orderId}`, { headers: window.Auth.getAuthHeaders('admin') });
      if (!res.ok) throw new Error('Não foi possível carregar os detalhes.');
      const order = await res.json();

      const detailsContent = document.getElementById('details-modal-content');
      
      let driverInfo = 'Não Atribuído';
      if (order.assigned_to_driver) {
        const u = order.assigned_to_driver.user || {};
        driverInfo = `${u.nome || 'Desconhecido'} (${order.assigned_to_driver.vehicle_plate || '-'})`;
      }

      detailsContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <p class="font-bold text-gray-500 uppercase">Dados do Pedido</p>
            <p class="mt-1"><b>ID:</b> ${order._id}</p>
            <p><b>Serviço:</b> ${order.service_type.toUpperCase()}</p>
            <p><b>Preço:</b> ${window.UI.formatCurrency(order.price)}</p>
            <p><b>Pagamento:</b> ${window.UI.getPaymentLabel(order.payment_method)}</p>
            <p class="mt-2"><b>Status:</b> ${window.UI.getStatusLabel(order.status)}</p>
          </div>
          <div>
            <p class="font-bold text-gray-500 uppercase">Cliente e Entrega</p>
            <p class="mt-1"><b>Cliente:</b> ${order.client_name}</p>
            <p><b>Telefones:</b> ${order.client_phone1} ${order.client_phone2 ? ' / ' + order.client_phone2 : ''}</p>
            <p><b>Morada:</b> ${order.address_text}</p>
            <p class="mt-2"><b>Motorista:</b> ${driverInfo}</p>
          </div>
        </div>
        
        <div class="mt-4 pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <p class="font-bold text-gray-500 uppercase">Valores Operacionais</p>
            <p class="mt-1"><b>Ganho Motorista:</b> ${window.UI.formatCurrency(order.valor_motorista || 0)}</p>
            <p><b>Lucro Empresa:</b> ${window.UI.formatCurrency(order.valor_empresa || 0)}</p>
          </div>
          <div>
            <p class="font-bold text-gray-500 uppercase">Código de Fecho</p>
            <p class="mt-1 font-mono text-lg font-bold text-[#2F7A3C] tracking-widest">${order.verification_code}</p>
          </div>
        </div>

        ${order.image_url ? `
          <div class="mt-4 pt-3 border-t">
            <p class="font-bold text-gray-500 uppercase mb-2 text-xs">Imagem Anexa</p>
            <img src="${window.BASE_URL}${order.image_url}" alt="Anexo do pedido" class="max-h-48 rounded object-cover border mx-auto">
          </div>
        ` : ''}
      `;

      window.UI.openModal('modal-details');
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  }
};

// ==================================================
// MODULE: admin.js (Main Logic)
// ==================================================
const AdminApp = {
  socket: null,

  init: () => {
    if (!window.Auth.checkAuth('admin')) return;

    // Preencher Nome
    const name = localStorage.getItem('adminName') || 'Administrador';
    document.getElementById('admin-user-name').innerText = name;

    // Inicializar Secção Principal
    AdminApp.showSection('visao-geral');

    // Inicializar WebSockets
    AdminApp.initSocket();

    // Eventos Gerais
    AdminApp.bindEvents();
  },

  bindEvents: () => {
    // Links do Menu
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        AdminApp.showSection(section);
      });
    });

    // Submissão de Formulários
    const createOrderForm = document.getElementById('form-create-order');
    if (createOrderForm) {
      createOrderForm.addEventListener('submit', AdminApp.handleCreateOrder);
    }

    const createDriverForm = document.getElementById('form-create-driver');
    if (createDriverForm) {
      createDriverForm.addEventListener('submit', AdminApp.handleCreateDriver);
    }

    const createClientForm = document.getElementById('form-create-client');
    if (createClientForm) {
      createClientForm.addEventListener('submit', AdminApp.handleCreateClient);
    }

    const createCostForm = document.getElementById('form-create-cost');
    if (createCostForm) {
      createCostForm.addEventListener('submit', AdminApp.handleCreateCost);
    }

    const createManagerForm = document.getElementById('form-create-manager');
    if (createManagerForm) {
      createManagerForm.addEventListener('submit', AdminApp.handleCreateManager);
    }

    const createExpenseForm = document.getElementById('form-create-expense');
    if (createExpenseForm) {
      createExpenseForm.addEventListener('submit', AdminApp.handleCreateExpense);
    }

    const assignForm = document.getElementById('form-assign-order');
    if (assignForm) {
      assignForm.addEventListener('submit', AdminModals.submitAssignOrder);
    }

    // Formulário de Alteração de Senha
    const changePassForm = document.getElementById('form-change-password');
    if (changePassForm) {
      changePassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const senhaAntiga = changePassForm.senhaAntiga.value;
        const senhaNova = changePassForm.senhaNova.value;

        try {
          const res = await fetch(`${window.API_URL}/auth/change-password`, {
            method: 'PUT',
            headers: window.Auth.getAuthHeaders('admin'),
            body: JSON.stringify({ senhaAntiga, senhaNova })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          
          window.UI.showAlert('Senha alterada com sucesso!');
          changePassForm.reset();
        } catch (err) {
          window.UI.showAlert(err.message, 'error');
        }
      });
    }

    // Formulário de Exportação Financeira
    const exportForm = document.getElementById('form-export-financial');
    if (exportForm) {
      exportForm.addEventListener('submit', AdminApp.handleExportFinancial);
    }
  },

  showSection: (sectionId) => {
    // Esconder todas as secções
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
    
    // Mostrar a secção ativa
    const activeSec = document.getElementById(`section-${sectionId}`);
    if (activeSec) activeSec.classList.remove('hidden');

    // Atualizar estado ativo dos botões
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-section') === sectionId) {
        link.classList.add('bg-[#2F7A3C]', 'text-white');
        link.classList.remove('text-[#50494B]', 'hover:bg-gray-100');
      } else {
        link.classList.remove('bg-[#2F7A3C]', 'text-white');
        link.classList.add('text-[#50494B]', 'hover:bg-gray-100');
      }
    });

    // Fechar menu mobile se estiver aberto
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
    }

    // Carregar dados dinâmicos da secção
    AdminApp.loadSectionData(sectionId);
  },

  loadSectionData: (sectionId) => {
    switch(sectionId) {
      case 'visao-geral':
        AdminApp.loadOverview();
        break;
      case 'criar-entrega':
        AdminApp.loadClientsForSelect();
        break;
      case 'entregas':
        AdminApp.loadActiveOrders();
        break;
      case 'historico':
        AdminApp.loadHistoryOrders();
        break;
      case 'motoristas':
        AdminApp.loadDrivers();
        break;
      case 'clientes':
        AdminApp.loadClients();
        break;
      case 'custos':
        AdminApp.loadCosts();
        break;
      case 'cargos':
        AdminApp.loadManagers();
        break;
      case 'despesas':
        AdminApp.loadExpenses();
        break;
      case 'mapa':
        setTimeout(() => AdminMap.initMap(), 100);
        break;
    }
  },

  // ==================================================
  // WEBSOCKETS REAL-TIME
  // ==================================================
  initSocket: () => {
    const token = window.Auth.getAuthToken('admin');
    if (!token) return;

    AdminApp.socket = io(window.BASE_URL, {
      auth: { token }
    });

    AdminApp.socket.on('connect', () => {
      console.log('[Admin Socket] Ligado ao servidor Real-Time.');
    });

    AdminApp.socket.on('order_pending', (order) => {
      window.UI.showAlert(`Nova Encomenda Criada! (${order.service_type})`, 'success');
      AdminApp.refreshIfActive('entregas', AdminApp.loadActiveOrders);
      AdminApp.refreshIfActive('visao-geral', AdminApp.loadOverview);
    });

    AdminApp.socket.on('pickup_started', (order) => {
      window.UI.showAlert(`Motorista iniciou a recolha da entrega #${order._id.substring(0, 6)}`, 'warning');
      AdminApp.refreshIfActive('entregas', AdminApp.loadActiveOrders);
    });

    AdminApp.socket.on('pickup_completed', (order) => {
      window.UI.showAlert(`Recolha concluída para entrega #${order._id.substring(0, 6)}`, 'success');
      AdminApp.refreshIfActive('entregas', AdminApp.loadActiveOrders);
    });

    AdminApp.socket.on('delivery_started', (order) => {
      window.UI.showAlert(`Entrega final iniciada #${order._id.substring(0, 6)}`, 'warning');
      AdminApp.refreshIfActive('entregas', AdminApp.loadActiveOrders);
    });

    AdminApp.socket.on('delivery_completed', (order) => {
      window.UI.showAlert(`Entrega #${order._id.substring(0, 6)} Finalizada com Sucesso!`, 'success');
      AdminApp.refreshIfActive('entregas', AdminApp.loadActiveOrders);
      AdminApp.refreshIfActive('visao-geral', AdminApp.loadOverview);
    });

    AdminApp.socket.on('order_canceled', (order) => {
      window.UI.showAlert(`Entrega #${order._id.substring(0, 6)} foi cancelada.`, 'error');
      AdminApp.refreshIfActive('entregas', AdminApp.loadActiveOrders);
    });

    AdminApp.socket.on('driver_status_changed', () => {
      AdminApp.refreshIfActive('motoristas', AdminApp.loadDrivers);
      AdminApp.refreshIfActive('visao-geral', AdminApp.loadOverview);
    });

    AdminApp.socket.on('driver_location_broadcast', (data) => {
      AdminMap.updateDriverMarkers(data.drivers);
    });
  },

  refreshIfActive: (sectionId, callback) => {
    const sec = document.getElementById(`section-${sectionId}`);
    if (sec && !sec.classList.contains('hidden')) {
      callback();
    }
  },

  // ==================================================
  // CARREGADORES DE DADOS (LOADERS)
  // ==================================================
  loadOverview: async () => {
    try {
      const stats = await AdminApi.fetchStats();
      document.getElementById('stat-pendentes').innerText = stats.pendentes;
      document.getElementById('stat-em-transito').innerText = stats.emTransito;
      document.getElementById('stat-concluidas').innerText = stats.concluidasHoje;
      document.getElementById('stat-online').innerText = stats.motoristasOnline;

      // Carregar Gráficos
      const services = await AdminApi.fetchServicesStats();
      AdminCharts.renderServicesChart(services.labels, services.dataValues);

      const finances = await AdminApi.fetchCostsSummary();
      AdminCharts.renderCostsChart(finances.history.labels, finances.history.revenue, finances.history.costs);

      // Atualizar Top Driver e Resumo Financeiro
      const fin = await AdminApi.fetchFinancialStats();
      document.getElementById('fin-receita').innerText = window.UI.formatCurrency(fin.totalReceita);
      document.getElementById('fin-lucro').innerText = window.UI.formatCurrency(fin.totalLucroEmpresa);
      document.getElementById('fin-ganhos-motoristas').innerText = window.UI.formatCurrency(fin.totalGanhosMotorista);
      document.getElementById('fin-top-driver').innerText = fin.topDriver;
    } catch (err) {
      console.warn('Erro na visão geral:', err);
    }
  },

  loadClientsForSelect: async () => {
    const select = document.getElementById('order-client-select');
    if (!select) return;

    try {
      const clients = await AdminApi.fetchClients();
      select.innerHTML = '<option value="">Cliente Ocasional (Sem Vínculo)</option>';
      clients.forEach(c => {
        select.innerHTML += `<option value="${c._id}">${c.nome} (${c.empresa || 'Individual'})</option>`;
      });

      // Se selecionar um cliente, auto-preencher os dados
      select.addEventListener('change', () => {
        const selected = clients.find(cl => cl._id === select.value);
        if (selected) {
          document.getElementById('order-client-name').value = selected.nome;
          document.getElementById('order-client-phone').value = selected.telefone;
          document.getElementById('order-client-address').value = selected.endereco || '';
        }
      });
    } catch (err) {
      select.innerHTML = '<option value="">Erro ao carregar clientes</option>';
    }
  },

  loadActiveOrders: async () => {
    window.UI.showLoader('active-orders-table-container');
    try {
      const orders = await AdminApi.fetchActiveOrders();
      const container = document.getElementById('active-orders-table-container');

      if (orders.length === 0) {
        window.UI.showEmptyState('active-orders-table-container', 'Nenhuma entrega ativa no momento.');
        return;
      }

      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-[#50494B] uppercase text-[10px] tracking-wider border-b">
              <th class="p-3">ID / Serviço</th>
              <th class="p-3">Cliente</th>
              <th class="p-3">Morada</th>
              <th class="p-3">Motorista</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      orders.forEach(o => {
        let driverName = '<span class="text-gray-400">Não Atribuído</span>';
        if (o.assigned_to_driver && o.assigned_to_driver.user) {
          driverName = o.assigned_to_driver.user.nome;
        }

        html += `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="p-3">
              <span class="font-mono font-bold text-[#2F7A3C]">${o._id.substring(0, 6)}</span>
              <span class="block text-[10px] text-gray-500 uppercase">${o.service_type}</span>
            </td>
            <td class="p-3 font-medium">
              ${o.client_name}
              <span class="block text-[10px] text-gray-500">${o.client_phone1}</span>
            </td>
            <td class="p-3 max-w-xs truncate" title="${o.address_text}">${o.address_text}</td>
            <td class="p-3">${driverName}</td>
            <td class="p-3">${window.UI.getStatusLabel(o.status)}</td>
            <td class="p-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button onclick="AdminModals.openOrderDetails('${o._id}')" class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Ver Detalhes">
                  <i class="fas fa-eye"></i>
                </button>
                <button onclick="AdminModals.openAssignModal('${o._id}')" class="p-1 text-amber-600 hover:bg-amber-50 rounded" title="Atribuir Motorista">
                  <i class="fas fa-user-tag"></i>
                </button>
                <button onclick="AdminApp.handleCancelOrder('${o._id}')" class="p-1 text-red-600 hover:bg-red-50 rounded" title="Cancelar Pedido">
                  <i class="fas fa-ban"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      window.UI.showEmptyState('active-orders-table-container', 'Erro ao carregar as encomendas.');
    }
  },

  loadHistoryOrders: async () => {
    window.UI.showLoader('history-orders-table-container');
    try {
      const orders = await AdminApi.fetchHistoryOrders();
      const container = document.getElementById('history-orders-table-container');

      if (orders.length === 0) {
        window.UI.showEmptyState('history-orders-table-container', 'Nenhum registo no histórico.');
        return;
      }

      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-[#50494B] uppercase text-[10px] tracking-wider border-b">
              <th class="p-3">ID / Data</th>
              <th class="p-3">Cliente</th>
              <th class="p-3">Serviço</th>
              <th class="p-3">Preço</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      orders.forEach(o => {
        const dateStr = window.UI.formatDate(o.timestamp_completed || o.createdAt);
        html += `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="p-3">
              <span class="font-mono font-bold text-[#2F7A3C]">${o._id.substring(0, 6)}</span>
              <span class="block text-[10px] text-gray-500">${dateStr}</span>
            </td>
            <td class="p-3 font-medium">${o.client_name}</td>
            <td class="p-3 uppercase text-[10px]">${o.service_type}</td>
            <td class="p-3 font-semibold">${window.UI.formatCurrency(o.price)}</td>
            <td class="p-3">${window.UI.getStatusLabel(o.status)}</td>
            <td class="p-3 text-right">
              <button onclick="AdminModals.openOrderDetails('${o._id}')" class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Ver Detalhes">
                <i class="fas fa-eye"></i>
              </button>
            </td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      window.UI.showEmptyState('history-orders-table-container', 'Erro ao carregar histórico.');
    }
  },

  loadDrivers: async () => {
    window.UI.showLoader('drivers-table-container');
    try {
      const drivers = await AdminApi.fetchDrivers();
      const container = document.getElementById('drivers-table-container');

      if (drivers.length === 0) {
        window.UI.showEmptyState('drivers-table-container', 'Nenhum motorista registado.');
        return;
      }

      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-[#50494B] uppercase text-[10px] tracking-wider border-b">
              <th class="p-3">Nome</th>
              <th class="p-3">Contactos</th>
              <th class="p-3">Matrícula</th>
              <th class="p-3">Comissão</th>
              <th class="p-3">Status</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      drivers.forEach(d => {
        const p = d.profile || {};
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-3 font-bold text-[#2F7A3C]">${d.nome}</td>
            <td class="p-3">
              ${d.telefone}
              <span class="block text-[10px] text-gray-500">${d.email}</span>
            </td>
            <td class="p-3 font-mono">${p.vehicle_plate || '-'}</td>
            <td class="p-3">${p.commissionRate || 20}%</td>
            <td class="p-3">${window.UI.getDriverStatusLabel(p.status)}</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      window.UI.showEmptyState('drivers-table-container', 'Erro ao carregar motoristas.');
    }
  },

  loadClients: async () => {
    window.UI.showLoader('clients-table-container');
    try {
      const clients = await AdminApi.fetchClients();
      const container = document.getElementById('clients-table-container');

      if (clients.length === 0) {
        window.UI.showEmptyState('clients-table-container', 'Nenhum cliente registado.');
        return;
      }

      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-[#50494B] uppercase text-[10px] tracking-wider border-b">
              <th class="p-3">Empresa / Nome</th>
              <th class="p-3">Contactos</th>
              <th class="p-3">NUIT</th>
              <th class="p-3">Endereço</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      clients.forEach(c => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-3 font-bold text-[#2F7A3C]">
              ${c.empresa || c.nome}
              ${c.empresa ? `<span class="block text-[10px] font-normal text-gray-500">${c.nome}</span>` : ''}
            </td>
            <td class="p-3">
              ${c.telefone}
              <span class="block text-[10px] text-gray-500">${c.email || ''}</span>
            </td>
            <td class="p-3 font-mono">${c.nuit || '-'}</td>
            <td class="p-3 max-w-xs truncate">${c.endereco || '-'}</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      window.UI.showEmptyState('clients-table-container', 'Erro ao carregar clientes.');
    }
  },

  loadCosts: async () => {
    window.UI.showLoader('costs-table-container');
    try {
      const costs = await AdminApi.fetchCosts();
      const container = document.getElementById('costs-table-container');

      if (costs.length === 0) {
        window.UI.showEmptyState('costs-table-container', 'Nenhum custo registado.');
        return;
      }

      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-[#50494B] uppercase text-[10px] tracking-wider border-b">
              <th class="p-3">Data</th>
              <th class="p-3">Categoria</th>
              <th class="p-3">Descrição</th>
              <th class="p-3">Valor</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      costs.forEach(c => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-3">${window.UI.formatDate(c.date, false)}</td>
            <td class="p-3 uppercase text-[10px] font-semibold">${c.category}</td>
            <td class="p-3 max-w-xs truncate">${c.description}</td>
            <td class="p-3 font-bold text-[#C97813]">${window.UI.formatCurrency(c.amount)}</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      window.UI.showEmptyState('costs-table-container', 'Erro ao carregar custos.');
    }
  },

  loadManagers: async () => {
    window.UI.showLoader('managers-table-container');
    try {
      const managers = await AdminApi.fetchManagers();
      const container = document.getElementById('managers-table-container');

      if (managers.length === 0) {
        window.UI.showEmptyState('managers-table-container', 'Nenhum gestor registado.');
        return;
      }

      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-[#50494B] uppercase text-[10px] tracking-wider border-b">
              <th class="p-3">Nome</th>
              <th class="p-3">Email</th>
              <th class="p-3">Telefone</th>
              <th class="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      managers.forEach(m => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-3 font-bold text-[#2F7A3C]">${m.nome}</td>
            <td class="p-3">${m.email}</td>
            <td class="p-3">${m.telefone}</td>
            <td class="p-3 text-right">
              <button onclick="AdminApp.handleDeleteManager('${m._id}')" class="p-1 text-red-600 hover:bg-red-50 rounded" title="Remover Gestor">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      window.UI.showEmptyState('managers-table-container', 'Erro ao carregar gestores.');
    }
  },

  loadExpenses: async () => {
    window.UI.showLoader('expenses-table-container');
    try {
      const expenses = await AdminApi.fetchExpenses();
      const container = document.getElementById('expenses-table-container');

      if (expenses.length === 0) {
        window.UI.showEmptyState('expenses-table-container', 'Nenhuma despesa lançada.');
        return;
      }

      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-[#50494B] uppercase text-[10px] tracking-wider border-b">
              <th class="p-3">Data</th>
              <th class="p-3">Categoria</th>
              <th class="p-3">Descrição</th>
              <th class="p-3">Valor</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      expenses.forEach(e => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-3">${window.UI.formatDate(e.date, false)}</td>
            <td class="p-3 uppercase text-[10px] font-semibold">${e.category}</td>
            <td class="p-3">${e.description}</td>
            <td class="p-3 font-bold text-red-600">${window.UI.formatCurrency(e.amount)}</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      window.UI.showEmptyState('expenses-table-container', 'Erro ao carregar despesas.');
    }
  },

  // ==================================================
  // HANDLERS DE FORMULÁRIO E AÇÕES
  // ==================================================
  handleCreateOrder: async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    const formData = new FormData();
    formData.append('service_type', form.service_type.value);
    formData.append('client_name', form.client_name.value.trim());
    formData.append('client_phone1', form.client_phone1.value.trim());
    formData.append('client_phone2', form.client_phone2.value.trim());
    formData.append('price', form.price.value);
    formData.append('payment_method', form.payment_method.value);
    formData.append('address_text', form.address_text.value.trim());
    formData.append('lat', form.lat.value);
    formData.append('lng', form.lng.value);
    formData.append('autoAssign', form.autoAssign.checked);

    const clientId = form.clientId.value;
    if (clientId) formData.append('clientId', clientId);

    const imageFile = form.image.files[0];
    if (imageFile) formData.append('image', imageFile);

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Criando...';

    try {
      await AdminApi.createOrder(formData);
      window.UI.showAlert('Encomenda criada com sucesso!', 'success');
      form.reset();
      AdminApp.showSection('entregas');
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  },

  handleCreateDriver: async (e) => {
    e.preventDefault();
    const form = e.target;
    const driverData = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      password: form.password.value,
      vehicle_plate: form.vehicle_plate.value.trim(),
      commissionRate: Number(form.commissionRate.value)
    };

    try {
      await AdminApi.createDriver(driverData);
      window.UI.showAlert('Motorista registado com sucesso!');
      form.reset();
      AdminApp.loadDrivers();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleCreateClient: async (e) => {
    e.preventDefault();
    const form = e.target;
    const clientData = {
      nome: form.nome.value.trim(),
      telefone: form.telefone.value.trim(),
      email: form.email.value.trim(),
      empresa: form.empresa.value.trim(),
      nuit: form.nuit.value.trim(),
      endereco: form.endereco.value.trim()
    };

    try {
      await AdminApi.createClient(clientData);
      window.UI.showAlert('Cliente registado com sucesso!');
      form.reset();
      AdminApp.loadClients();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleCreateCost: async (e) => {
    e.preventDefault();
    const form = e.target;
    const costData = {
      category: form.category.value,
      amount: Number(form.amount.value),
      description: form.description.value.trim(),
      date: form.date.value || new Date()
    };

    try {
      await AdminApi.createCost(costData);
      window.UI.showAlert('Custo registado com sucesso!');
      form.reset();
      AdminApp.loadCosts();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleCreateManager: async (e) => {
    e.preventDefault();
    const form = e.target;
    const managerData = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      password: form.password.value
    };

    try {
      await AdminApi.createManager(managerData);
      window.UI.showAlert('Gestor criado com sucesso!');
      form.reset();
      AdminApp.loadManagers();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleDeleteManager: async (id) => {
    if (!confirm('Tem a certeza que deseja remover este gestor?')) return;
    try {
      await AdminApi.deleteManager(id);
      window.UI.showAlert('Gestor removido.');
      AdminApp.loadManagers();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleCreateExpense: async (e) => {
    e.preventDefault();
    const form = e.target;
    const expenseData = {
      category: form.category.value.trim(),
      description: form.description.value.trim(),
      amount: Number(form.amount.value),
      date: form.date.value || new Date()
    };

    try {
      await AdminApi.createExpense(expenseData);
      window.UI.showAlert('Despesa lançada com sucesso!');
      form.reset();
      AdminApp.loadExpenses();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleCancelOrder: async (orderId) => {
    const reason = prompt('Indique o motivo do cancelamento:');
    if (reason === null) return;

    try {
      await AdminApi.cancelOrder(orderId, reason);
      window.UI.showAlert('Entrega cancelada com sucesso.');
      AdminApp.loadActiveOrders();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleDeleteHistory: async () => {
    if (!confirm('Atenção: Esta ação irá remover permanentemente todas as encomendas concluídas ou canceladas com mais de 30 dias. Deseja continuar?')) return;

    try {
      const res = await AdminApi.deleteHistory();
      window.UI.showAlert(res.message, 'success');
      AdminApp.loadHistoryOrders();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleExportFinancial: async (e) => {
    e.preventDefault();
    const form = e.target;
    const startDate = form.startDate.value;
    const endDate = form.endDate.value;

    if (!startDate || !endDate) {
      window.UI.showAlert('Selecione as datas de início e fim.', 'warning');
      return;
    }

    const url = `${window.API_URL}/admin/export-financial?startDate=${startDate}&endDate=${endDate}`;
    
    // Abrir download diretamente
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.UI.showAlert('Exportação iniciada!', 'success');
  }
};

window.AdminApp = AdminApp;
