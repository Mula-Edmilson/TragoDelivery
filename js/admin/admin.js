// ==================================================
// MÓDULO PRINCIPAL DO ADMINISTRADOR (admin.js)
// ==================================================

const AdminApp = {
  socket: null,

  init: () => {
    if (!window.Auth.checkAuth('admin')) return;

    const name = localStorage.getItem('adminName') || 'Administrador';
    document.getElementById('admin-user-name').innerText = name;

    AdminApp.showSection('visao-geral');
    AdminApp.initSocket();
    AdminApp.bindEvents();
  },

  bindEvents: () => {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        AdminApp.showSection(section);
      });
    });

    const createOrderForm = document.getElementById('form-create-order');
    if (createOrderForm) createOrderForm.addEventListener('submit', AdminApp.handleCreateOrder);

    const createDriverForm = document.getElementById('form-create-driver');
    if (createDriverForm) createDriverForm.addEventListener('submit', AdminApp.handleCreateDriver);

    const createClientForm = document.getElementById('form-create-client');
    if (createClientForm) createClientForm.addEventListener('submit', AdminApp.handleCreateClient);

    const createCostForm = document.getElementById('form-create-cost');
    if (createCostForm) createCostForm.addEventListener('submit', AdminApp.handleCreateCost);

    const createManagerForm = document.getElementById('form-create-manager');
    if (createManagerForm) createManagerForm.addEventListener('submit', window.AdminManagers.handleCreateManager);

    const editManagerForm = document.getElementById('form-edit-manager');
    if (editManagerForm) editManagerForm.addEventListener('submit', window.AdminManagers.handleUpdateManager);

    const createExpenseForm = document.getElementById('form-create-expense');
    if (createExpenseForm) createExpenseForm.addEventListener('submit', window.AdminExpenses.handleCreateExpense);

    const editExpenseForm = document.getElementById('form-edit-expense');
    if (editExpenseForm) editExpenseForm.addEventListener('submit', window.AdminExpenses.handleUpdateExpense);

    const assignForm = document.getElementById('form-assign-order');
    if (assignForm) assignForm.addEventListener('submit', window.AdminModals.submitAssignOrder);

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

    const exportForm = document.getElementById('form-export-financial');
    if (exportForm) exportForm.addEventListener('submit', AdminApp.handleExportFinancial);
  },

  showSection: (sectionId) => {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
    
    const activeSec = document.getElementById(`section-${sectionId}`);
    if (activeSec) activeSec.classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-section') === sectionId) {
        link.classList.add('bg-[#2F7A3C]', 'text-white');
        link.classList.remove('text-[#50494B]', 'hover:bg-white/5');
      } else {
        link.classList.remove('bg-[#2F7A3C]', 'text-white');
        link.classList.add('text-[#50494B]', 'hover:bg-white/5');
      }
    });

    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
    }

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
        window.AdminManagers.loadManagers();
        break;
      case 'despesas':
        window.AdminExpenses.loadExpenses();
        break;
      case 'mapa':
        setTimeout(() => window.AdminMap.initMap(), 100);
        break;
    }
  },

  initSocket: () => {
    const token = window.Auth.getAuthToken('admin');
    if (!token) return;

    AdminApp.socket = io(window.BASE_URL, { auth: { token } });

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
      window.AdminMap.updateDriverMarkers(data.drivers);
    });
  },

  refreshIfActive: (sectionId, callback) => {
    const sec = document.getElementById(`section-${sectionId}`);
    if (sec && !sec.classList.contains('hidden')) {
      callback();
    }
  },

  loadOverview: async () => {
    try {
      const stats = await window.AdminApi.fetchStats();
      document.getElementById('stat-pendentes').innerText = stats.pendentes;
      document.getElementById('stat-em-transito').innerText = stats.emTransito;
      document.getElementById('stat-concluidas').innerText = stats.concluidasHoje;
      document.getElementById('stat-online').innerText = stats.motoristasOnline;

      const services = await window.AdminApi.fetchServicesStats();
      window.AdminCharts.renderServicesChart(services.labels, services.dataValues);

      const finances = await window.AdminApi.fetchCostsSummary();
      window.AdminCharts.renderCostsChart(finances.history.labels, finances.history.revenue, finances.history.costs);

      const fin = await window.AdminApi.fetchFinancialStats();
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
      const clients = await window.AdminApi.fetchClients();
      select.innerHTML = '<option value="">Cliente Ocasional (Sem Vínculo)</option>';
      clients.forEach(c => {
        select.innerHTML += `<option value="${c._id}">${c.nome} (${c.empresa || 'Individual'})</option>`;
      });

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
      const orders = await window.AdminApi.fetchActiveOrders();
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
                <button onclick="window.AdminModals.openOrderDetails('${o._id}')" class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Ver Detalhes">
                  <i class="fas fa-eye"></i>
                </button>
                <button onclick="window.AdminModals.openAssignModal('${o._id}')" class="p-1 text-amber-600 hover:bg-amber-50 rounded" title="Atribuir Motorista">
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
      const orders = await window.AdminApi.fetchHistoryOrders();
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
              <button onclick="window.AdminModals.openOrderDetails('${o._id}')" class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Ver Detalhes">
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
      const drivers = await window.AdminApi.fetchDrivers();
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
              <th class="p-3 text-right">Operações</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      drivers.forEach(d => {
        const p = d.profile || {};
        const safeNome = d.nome.replace(/'/g, "\\'");

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
            <td class="p-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button onclick="window.AdminMap.focusDriver('${p._id}')" class="p-1 text-green-600 hover:bg-green-50 rounded" title="Focar no Mapa">
                  <i class="fas fa-map-marker-alt"></i>
                </button>
                <button onclick="window.AdminModals.openDriverReportModal('${p._id}', '${safeNome}')" class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Relatório de Desempenho">
                  <i class="fas fa-chart-line"></i>
                </button>
                <button onclick="window.AdminModals.openDriverTripsModal('${p._id}', '${safeNome}')" class="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Rasto de Viagens (Trips)">
                  <i class="fas fa-route"></i>
                </button>
              </div>
            </td>
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
      const clients = await window.AdminApi.fetchClients();
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
              <th class="p-3 text-right">Finanças</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      clients.forEach(c => {
        const safeName = (c.empresa || c.nome).replace(/'/g, "\\'");

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
            <td class="p-3 text-right">
              <button onclick="window.AdminModals.openClientStatementModal('${c._id}', '${safeName}')" class="p-1 text-amber-600 hover:bg-amber-50 rounded" title="Gerar Extrato">
                <i class="fas fa-file-invoice-dollar"></i> Extrato
              </button>
            </td>
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
      const costs = await window.AdminApi.fetchCosts();
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
      await window.AdminApi.createOrder(formData);
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
      await window.AdminApi.createDriver(driverData);
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
      await window.AdminApi.createClient(clientData);
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
      await window.AdminApi.createCost(costData);
      window.UI.showAlert('Custo registado com sucesso!');
      form.reset();
      AdminApp.loadCosts();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleCancelOrder: async (orderId) => {
    const reason = prompt('Indique o motivo do cancelamento:');
    if (reason === null) return;

    try {
      await window.AdminApi.cancelOrder(orderId, reason);
      window.UI.showAlert('Entrega cancelada com sucesso.');
      AdminApp.loadActiveOrders();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleDeleteHistory: async () => {
    if (!confirm('Atenção: Esta ação irá remover permanentemente todas as encomendas concluídas ou canceladas com mais de 30 dias. Deseja continuar?')) return;

    try {
      const res = await window.AdminApi.deleteHistory();
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
