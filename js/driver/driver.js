// ==================================================
// MÓDULO PRINCIPAL DO MOTORISTA (driver.js)
// ==================================================

const DriverUI = {
  updateOnlineStatus: (isOnline) => {
    const badge = document.getElementById('driver-status-badge');
    if (!badge) return;

    if (isOnline) {
      badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1.5';
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span> Online';
    } else {
      badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1.5';
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-600"></span> Offline';
    }
  },

  updateLastLocationTime: () => {
    const el = document.getElementById('last-location-time');
    if (el) {
      el.innerText = `Última atualização: ${new Date().toLocaleTimeString()}`;
    }
  },

  showLocationPermissionError: (msg) => {
    const banner = document.getElementById('location-warning-banner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.querySelector('span').innerText = msg;
    }
  },

  hideLocationPermissionError: () => {
    const banner = document.getElementById('location-warning-banner');
    if (banner) banner.classList.add('hidden');
  }
};

window.DriverUI = DriverUI;

const DriverApp = {
  currentOrder: null,

  init: () => {
    if (!window.Auth.checkAuth('driver')) return;

    const name = localStorage.getItem('driverName') || 'Motorista';
    document.getElementById('driver-user-name').innerText = name;

    window.DriverTracking.init();
    DriverApp.loadDeliveries();
    DriverApp.bindEvents();
  },

  bindEvents: () => {
    document.querySelectorAll('.driver-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        DriverApp.showSection(section);
      });
    });

    const completeForm = document.getElementById('form-complete-delivery');
    if (completeForm) {
      completeForm.addEventListener('submit', DriverApp.handleCompleteDelivery);
    }

    const changePassForm = document.getElementById('form-driver-change-password');
    if (changePassForm) {
      changePassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const senhaAntiga = changePassForm.senhaAntiga.value;
        const senhaNova = changePassForm.senhaNova.value;

        try {
          const res = await fetch(`${window.API_URL}/auth/change-password`, {
            method: 'PUT',
            headers: window.Auth.getAuthHeaders('driver'),
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
  },

  showSection: (sectionId) => {
    document.querySelectorAll('.driver-section').forEach(sec => sec.classList.add('hidden'));
    
    const activeSec = document.getElementById(`section-${sectionId}`);
    if (activeSec) activeSec.classList.remove('hidden');

    document.querySelectorAll('.driver-nav-link').forEach(link => {
      if (link.getAttribute('data-section') === sectionId) {
        link.classList.add('bg-[#2F7A3C]', 'text-white');
        link.classList.remove('text-[#50494B]', 'hover:bg-gray-100');
      } else {
        link.classList.remove('bg-[#2F7A3C]', 'text-white');
        link.classList.add('text-[#50494B]', 'hover:bg-gray-100');
      }
    });

    if (sectionId === 'ganhos') {
      DriverApp.loadEarnings();
    }
  },

  loadDeliveries: async () => {
    window.UI.showLoader('deliveries-list-container');
    try {
      const res = await fetch(`${window.API_URL}/orders/my-deliveries`, { headers: window.Auth.getAuthHeaders('driver') });
      if (!res.ok) {
        if (res.status === 401) window.Auth.handle401Safely('driver');
        throw new Error('Erro ao carregar entregas.');
      }

      const orders = await res.json();
      const container = document.getElementById('deliveries-list-container');

      if (orders.length === 0) {
        window.UI.showEmptyState('deliveries-list-container', 'Nenhuma entrega atribuída de momento.');
        document.getElementById('current-order-details').innerHTML = `
          <div class="text-center py-12 text-gray-400">
            <i class="fas fa-truck text-4xl mb-2"></i>
            <p class="text-sm">Selecione uma entrega na lista para ver os detalhes e fluxo operacional.</p>
          </div>
        `;
        return;
      }

      let html = '<div class="flex flex-col gap-3">';
      orders.forEach(o => {
        const isCurrent = DriverApp.currentOrder && DriverApp.currentOrder._id === o._id;
        const border = isCurrent ? 'border-[#2F7A3C] ring-2 ring-[#2F7A3C]/20' : 'border-gray-200';

        html += `
          <div onclick="DriverApp.selectOrder('${o._id}')" class="p-3 bg-white rounded border ${border} shadow-sm hover:shadow cursor-pointer transition-all">
            <div class="flex items-center justify-between border-b pb-2 mb-2">
              <span class="font-mono font-bold text-[#2F7A3C] text-xs">#${o._id.substring(0, 6)}</span>
              ${window.UI.getStatusLabel(o.status)}
            </div>
            <p class="text-xs font-bold text-gray-800">${o.client_name}</p>
            <p class="text-xs text-gray-600 mt-0.5 truncate"><i class="fas fa-map-marker-alt text-red-500 mr-1"></i> ${o.address_text}</p>
            <div class="mt-2 pt-2 border-t flex items-center justify-between text-[11px] text-gray-500">
              <span class="uppercase font-semibold">${o.service_type}</span>
              <span class="font-bold text-[#C97813]">${window.UI.formatCurrency(o.price)}</span>
            </div>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;

      if (!DriverApp.currentOrder && orders.length > 0) {
        DriverApp.selectOrder(orders[0]._id);
      } else if (DriverApp.currentOrder) {
        DriverApp.selectOrder(DriverApp.currentOrder._id);
      }
    } catch (err) {
      window.UI.showEmptyState('deliveries-list-container', 'Erro ao carregar lista de entregas.');
    }
  },

  selectOrder: async (orderId) => {
    try {
      const res = await fetch(`${window.API_URL}/orders/${orderId}`, { headers: window.Auth.getAuthHeaders('driver') });
      if (!res.ok) throw new Error('Erro ao carregar detalhes do pedido.');
      const order = await res.json();

      DriverApp.currentOrder = order;

      document.querySelectorAll('#deliveries-list-container > div > div').forEach(card => {
        card.classList.remove('border-[#2F7A3C]', 'ring-2', 'ring-[#2F7A3C]/20');
        card.classList.add('border-gray-200');
      });

      const detailsContainer = document.getElementById('current-order-details');
      
      let buttonsHtml = '';
      if (order.status === 'atribuido' || order.status === 'pendente') {
        buttonsHtml = `
          <button onclick="DriverApp.updateOrderStatus('pickup-start')" class="w-full py-3 bg-[#C97813] hover:bg-[#a86410] text-white font-bold rounded shadow transition-all flex items-center justify-center gap-2 text-sm">
            <i class="fas fa-box-open text-lg"></i> Iniciar Recolha
          </button>
        `;
      } else if (order.status === 'recolha_em_progresso') {
        buttonsHtml = `
          <button onclick="DriverApp.updateOrderStatus('pickup-complete')" class="w-full py-3 bg-[#2F7A3C] hover:bg-[#245e2e] text-white font-bold rounded shadow transition-all flex items-center justify-center gap-2 text-sm">
            <i class="fas fa-check-square text-lg"></i> Concluir Recolha
          </button>
        `;
      } else if (order.status === 'recolha_concluida') {
        buttonsHtml = `
          <button onclick="DriverApp.updateOrderStatus('delivery-start')" class="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow transition-all flex items-center justify-center gap-2 text-sm">
            <i class="fas fa-shipping-fast text-lg"></i> Iniciar Entrega Final
          </button>
        `;
      } else if (order.status === 'entrega_em_progresso') {
        buttonsHtml = `
          <button onclick="DriverApp.openCompleteModal()" class="w-full py-3 bg-[#3DAA50] hover:bg-[#2f853e] text-white font-bold rounded shadow transition-all flex items-center justify-center gap-2 text-sm animate-bounce">
            <i class="fas fa-key text-lg"></i> Finalizar com Código
          </button>
        `;
      }

      detailsContainer.innerHTML = `
        <div class="bg-white p-4 rounded border shadow-sm">
          <div class="flex items-center justify-between border-b pb-3 mb-3">
            <div>
              <span class="text-[10px] text-gray-400 block uppercase font-bold">Entrega Selecionada</span>
              <span class="font-mono text-lg font-bold text-[#2F7A3C]">#${order._id.substring(0, 6)}</span>
            </div>
            ${window.UI.getStatusLabel(order.status)}
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <p class="text-gray-500 font-semibold uppercase text-[10px]">Cliente</p>
              <p class="font-bold text-sm text-gray-800">${order.client_name}</p>
              <p class="text-gray-600 mt-0.5">
                <i class="fas fa-phone-alt text-[#2F7A3C] mr-1"></i> 
                <a href="tel:${order.client_phone1}" class="text-blue-600 underline font-medium">${order.client_phone1}</a>
                ${order.client_phone2 ? ` / <a href="tel:${order.client_phone2}" class="text-blue-600 underline">${order.client_phone2}</a>` : ''}
              </p>
            </div>

            <div>
              <p class="text-gray-500 font-semibold uppercase text-[10px]">Endereço de Entrega</p>
              <p class="font-medium text-gray-800 mt-0.5">${order.address_text}</p>
              ${order.address_coords ? `
                <a href="https://www.google.com/maps/search/?api=1&query=${order.address_coords.lat},${order.address_coords.lng}" target="_maps" class="mt-1 inline-flex items-center gap-1 text-[#2F7A3C] hover:underline font-semibold">
                  <i class="fas fa-directions"></i> Abrir no Google Maps
                </a>
              ` : ''}
            </div>

            <div class="grid grid-cols-2 gap-2 pt-2 border-t">
              <div>
                <p class="text-gray-500 font-semibold uppercase text-[10px]">Valor a Cobrar</p>
                <p class="font-bold text-sm text-[#C97813]">${window.UI.formatCurrency(order.price)}</p>
              </div>
              <div>
                <p class="text-gray-500 font-semibold uppercase text-[10px]">Método Pagamento</p>
                <p class="mt-0.5">${window.UI.getPaymentLabel(order.payment_method)}</p>
              </div>
            </div>

            ${order.image_url ? `
              <div class="pt-2 border-t">
                <p class="text-gray-500 font-semibold uppercase text-[10px] mb-1">Imagem do Pacote</p>
                <img src="${window.BASE_URL}${order.image_url}" alt="Pacote" class="max-h-32 rounded object-cover border">
              </div>
            ` : ''}
          </div>

          <div class="mt-5 pt-3 border-t">
            ${buttonsHtml}
          </div>
        </div>
      `;

      if (window.innerWidth < 1024) {
        detailsContainer.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  updateOrderStatus: async (action) => {
    if (!DriverApp.currentOrder) return;

    try {
      const res = await fetch(`${window.API_URL}/orders/${DriverApp.currentOrder._id}/${action}`, {
        method: 'POST',
        headers: window.Auth.getAuthHeaders('driver')
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Erro ao atualizar o estado.');

      window.UI.showAlert('Estado operacional atualizado com sucesso!', 'success');
      DriverApp.loadDeliveries();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  openCompleteModal: () => {
    if (!DriverApp.currentOrder) return;
    document.getElementById('complete-order-id').value = DriverApp.currentOrder._id;
    document.getElementById('complete-order-code').value = '';
    window.UI.openModal('modal-complete');
  },

  handleCompleteDelivery: async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('complete-order-id').value;
    const verification_code = document.getElementById('complete-order-code').value.trim();

    if (!verification_code) {
      window.UI.showAlert('Introduza o código de verificação.', 'warning');
      return;
    }

    try {
      const res = await fetch(`${window.API_URL}/orders/${orderId}/delivery-complete`, {
        method: 'POST',
        headers: window.Auth.getAuthHeaders('driver'),
        body: JSON.stringify({ verification_code })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Código incorreto.');

      window.UI.showAlert('Entrega finalizada com sucesso! Ganhos contabilizados.', 'success');
      window.UI.closeModal('modal-complete');
      
      DriverApp.currentOrder = null;
      DriverApp.loadDeliveries();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  loadEarnings: async () => {
    window.UI.showLoader('earnings-list-container');
    try {
      const res = await fetch(`${window.API_URL}/drivers/my-earnings`, { headers: window.Auth.getAuthHeaders('driver') });
      if (!res.ok) throw new Error('Erro ao carregar os ganhos.');
      const data = await res.json();

      document.getElementById('earning-total').innerText = window.UI.formatCurrency(data.totalGanhos);
      document.getElementById('earning-count').innerText = data.totalOrders;
      document.getElementById('earning-rate').innerText = `${data.commissionRate || 20}%`;

      const container = document.getElementById('earnings-list-container');
      if (data.ordersList.length === 0) {
        window.UI.showEmptyState('earnings-list-container', 'Ainda não concluiu nenhuma entrega.');
        return;
      }

      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-[#50494B] uppercase text-[10px] tracking-wider border-b">
              <th class="p-3">ID / Data</th>
              <th class="p-3">Cliente</th>
              <th class="p-3">Valor Cobrado</th>
              <th class="p-3 text-right">Seu Ganho</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      data.ordersList.forEach(o => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-3">
              <span class="font-mono font-bold text-[#2F7A3C]">${o._id.substring(0, 6)}</span>
              <span class="block text-[10px] text-gray-500">${window.UI.formatDate(o.timestamp_completed)}</span>
            </td>
            <td class="p-3 font-medium">${o.client_name}</td>
            <td class="p-3">${window.UI.formatCurrency(o.price)}</td>
            <td class="p-3 text-right font-bold text-[#2F7A3C]">${window.UI.formatCurrency(o.valor_motorista)}</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      window.UI.showEmptyState('earnings-list-container', 'Erro ao carregar histórico de ganhos.');
    }
  }
};

window.DriverApp = DriverApp;
