// ==================================================
// MÓDULO DE MODAIS DO ADMINISTRADOR (adminModals.js)
// ==================================================

const AdminModals = {
  // --- ORDER ASSIGNMENT ---
  openAssignModal: async (orderId) => {
    document.getElementById('assign-order-id').value = orderId;
    window.UI.openModal('modal-assign');

    const selectEl = document.getElementById('assign-driver-select');
    selectEl.innerHTML = '<option value="">Carregando motoristas disponíveis...</option>';

    try {
      const drivers = await window.AdminApi.fetchAvailableDrivers();
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
      await window.AdminApi.assignOrder(orderId, driverId);
      window.UI.showAlert('Entrega atribuída com sucesso!');
      window.UI.closeModal('modal-assign');
      window.AdminApp.loadActiveOrders();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  // --- ORDER DETAILS ---
  openOrderDetails: async (orderId) => {
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
  },

  // --- DRIVER REPORT ---
  openDriverReportModal: async (driverId, driverName) => {
    document.getElementById('modal-generic-title').innerText = `Relatório de Desempenho: ${driverName}`;
    const content = document.getElementById('modal-generic-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-[#2F7A3C]"></i></div>';
    
    window.UI.openModal('modal-generic');

    try {
      const orders = await window.AdminApi.fetchDriverReport(driverId);
      
      if (orders.length === 0) {
        content.innerHTML = '<p class="text-center text-gray-500 py-6 text-xs">Este motorista ainda não concluiu nenhuma entrega.</p>';
        return;
      }

      let totalValue = 0;
      let totalDriverEarnings = 0;
      orders.forEach(o => {
        totalValue += o.price;
        totalDriverEarnings += (o.valor_motorista || 0);
      });

      let html = `
        <div class="grid grid-cols-2 gap-2 text-center mb-4">
          <div class="p-2 bg-gray-50 rounded border text-xs">
            <span class="text-[10px] text-gray-500 uppercase block">Total Movimentado</span>
            <span class="font-bold text-gray-800">${window.UI.formatCurrency(totalValue)}</span>
          </div>
          <div class="p-2 bg-gray-50 rounded border text-xs">
            <span class="text-[10px] text-gray-500 uppercase block">Ganhos do Motorista</span>
            <span class="font-bold text-[#2F7A3C]">${window.UI.formatCurrency(totalDriverEarnings)}</span>
          </div>
        </div>

        <div class="max-h-60 overflow-y-auto border rounded divide-y text-xs">
      `;

      orders.forEach(o => {
        html += `
          <div class="p-2.5 flex items-center justify-between hover:bg-gray-50">
            <div>
              <span class="font-mono font-bold text-[#2F7A3C]">#${o._id.substring(0, 6)}</span>
              <span class="text-gray-500 block text-[10px]">${window.UI.formatDate(o.timestamp_completed)}</span>
            </div>
            <div class="text-right">
              <span class="font-bold text-gray-800">${window.UI.formatCurrency(o.price)}</span>
              <span class="text-gray-500 block text-[10px]">${o.service_type.toUpperCase()}</span>
            </div>
          </div>
        `;
      });

      html += '</div>';
      content.innerHTML = html;
    } catch (err) {
      content.innerHTML = `<p class="text-center text-red-600 py-6 text-xs">${err.message}</p>`;
    }
  },

  // --- DRIVER TRIPS (HISTÓRICO DE VIAGENS) ---
  openDriverTripsModal: async (driverId, driverName) => {
    document.getElementById('modal-generic-title').innerText = `Rasto Operacional (Viagens): ${driverName}`;
    const content = document.getElementById('modal-generic-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-[#2F7A3C]"></i></div>';
    
    window.UI.openModal('modal-generic');

    try {
      const trips = await window.AdminApi.fetchDriverTrips(driverId);
      
      if (trips.length === 0) {
        content.innerHTML = '<p class="text-center text-gray-500 py-6 text-xs">Nenhum registo de viagem gravado para este motorista.</p>';
        return;
      }

      let html = '<div class="max-h-72 overflow-y-auto border rounded divide-y text-xs">';

      trips.forEach(t => {
        const metrics = t.metrics || {};
        html += `
          <div class="p-3 hover:bg-gray-50">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold uppercase text-[10px] px-1.5 py-0.5 bg-gray-100 rounded">${t.type}</span>
              <span class="text-gray-500 text-[10px]">${window.UI.formatDate(t.startedAt)}</span>
            </div>
            <p class="font-medium text-gray-800"><b>Origem:</b> ${t.origin || 'Desconhecida'}</p>
            <p class="font-medium text-gray-800"><b>Destino:</b> ${t.destination || 'Desconhecido'}</p>
            <div class="mt-2 flex items-center justify-between text-[11px] text-gray-500 border-t pt-1">
              <span><b>Distância:</b> ${metrics.distance ? metrics.distance + ' km' : '-'}</span>
              <span><b>Duração:</b> ${metrics.duration ? metrics.duration + ' min' : '-'}</span>
              <span><b>Status:</b> ${t.status}</span>
            </div>
          </div>
        `;
      });

      html += '</div>';
      content.innerHTML = html;
    } catch (err) {
      content.innerHTML = `<p class="text-center text-red-600 py-6 text-xs">${err.message}</p>`;
    }
  },

  // --- CLIENT STATEMENT ---
  openClientStatementModal: async (clientId, clientName) => {
    document.getElementById('modal-generic-title').innerText = `Extrato Financeiro: ${clientName}`;
    const content = document.getElementById('modal-generic-content');
    
    // Injetar formulário de filtro e área de resultados
    content.innerHTML = `
      <div class="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <label class="block text-gray-500 mb-0.5">Data Início</label>
          <input type="date" id="stmt-start" class="w-full p-1 border rounded">
        </div>
        <div>
          <label class="block text-gray-500 mb-0.5">Data Fim</label>
          <input type="date" id="stmt-end" class="w-full p-1 border rounded">
        </div>
      </div>
      <button onclick="AdminModals.loadClientStatement('${clientId}')" class="w-full py-1.5 bg-[#2F7A3C] text-white font-bold rounded text-xs shadow mb-4">
        Filtrar Extrato
      </button>
      <div id="stmt-results" class="text-center py-4 text-gray-400 text-xs">
        Selecione as datas ou clique em Filtrar para carregar todas as encomendas faturadas.
      </div>
    `;

    window.UI.openModal('modal-generic');
    // Auto-carregar tudo por omissão
    AdminModals.loadClientStatement(clientId);
  },

  loadClientStatement: async (clientId) => {
    const resultsArea = document.getElementById('stmt-results');
    const start = document.getElementById('stmt-start')?.value;
    const end = document.getElementById('stmt-end')?.value;

    resultsArea.innerHTML = '<i class="fas fa-spinner fa-spin text-lg text-[#2F7A3C]"></i>';

    try {
      const data = await window.AdminApi.fetchClientStatement(clientId, start, end);

      if (data.ordersList.length === 0) {
        resultsArea.innerHTML = '<p class="text-gray-500 py-2">Nenhuma entrega registada neste período.</p>';
        return;
      }

      let html = `
        <div class="grid grid-cols-2 gap-2 text-center mb-3 text-xs">
          <div class="p-1.5 bg-gray-50 rounded border">
            <span class="text-[10px] text-gray-500 uppercase block">Total Faturado</span>
            <span class="font-bold text-[#C97813]">${window.UI.formatCurrency(data.totalValue)}</span>
          </div>
          <div class="p-1.5 bg-gray-50 rounded border">
            <span class="text-[10px] text-gray-500 uppercase block">Volume de Entregas</span>
            <span class="font-bold text-gray-800">${data.totalOrders}</span>
          </div>
        </div>

        <div class="max-h-48 overflow-y-auto border rounded divide-y text-left text-xs">
      `;

      data.ordersList.forEach(o => {
        html += `
          <div class="p-2 flex items-center justify-between hover:bg-gray-50">
            <div>
              <span class="font-mono font-bold text-[#2F7A3C]">#${o._id.substring(0, 6)}</span>
              <span class="text-gray-500 block text-[10px]">${window.UI.formatDate(o.timestamp_completed)}</span>
            </div>
            <div class="text-right">
              <span class="font-bold text-gray-800">${window.UI.formatCurrency(o.price)}</span>
              <span class="text-gray-500 block text-[10px]">${o.service_type.toUpperCase()}</span>
            </div>
          </div>
        `;
      });

      html += '</div>';
      resultsArea.innerHTML = html;
    } catch (err) {
      resultsArea.innerHTML = `<p class="text-red-600 py-2">${err.message}</p>`;
    }
  },

  // --- EDIT MANAGER ---
  openEditManagerModal: (id, nome, email, telefone) => {
    document.getElementById('edit-manager-id').value = id;
    document.getElementById('edit-manager-nome').value = nome;
    document.getElementById('edit-manager-email').value = email;
    document.getElementById('edit-manager-telefone').value = telefone;
    document.getElementById('edit-manager-password').value = '';
    
    window.UI.openModal('modal-edit-manager');
  },

  // --- EDIT EXPENSE ---
  openEditExpenseModal: (id, category, amount, description, date) => {
    document.getElementById('edit-expense-id').value = id;
    document.getElementById('edit-expense-category').value = category;
    document.getElementById('edit-expense-amount').value = amount;
    document.getElementById('edit-expense-description').value = description;
    
    if (date) {
      document.getElementById('edit-expense-date').value = new Date(date).toISOString().split('T')[0];
    }

    window.UI.openModal('modal-edit-expense');
  }
};

window.AdminModals = AdminModals;
