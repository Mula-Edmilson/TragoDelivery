// ==================================================
// MÓDULO DE INTERFACE E COMPONENTES
// ==================================================

const UI = {
  // ==================================================
  // 1. ALERTAS PERSONALIZADOS
  // ==================================================
  showAlert: (message, type = 'success') => {
    let container = document.getElementById('alert-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'alert-container';
      container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
      document.body.appendChild(container);
    }

    const alertEl = document.createElement('div');
    const bg = type === 'success' ? 'bg-[#2F7A3C]' : type === 'warning' ? 'bg-[#C97813]' : 'bg-red-600';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle';

    alertEl.className = `${bg} text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 pointer-events-auto transition-all duration-300 transform translate-x-full`;
    alertEl.innerHTML = `
      <i class="fas ${icon} text-lg shrink-0"></i>
      <span class="text-sm font-medium flex-1">${message}</span>
      <button class="text-white/80 hover:text-white shrink-0" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(alertEl);
    
    // Animação de entrada
    setTimeout(() => alertEl.classList.remove('translate-x-full'), 10);

    // Auto-remoção
    setTimeout(() => {
      alertEl.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => alertEl.remove(), 300);
    }, 4000);
  },

  // ==================================================
  // 2. MODAIS
  // ==================================================
  openModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  },

  // ==================================================
  // 3. LOADERS
  // ==================================================
  showLoader: (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12">
          <i class="fas fa-circle-notch fa-spin text-4xl text-[#2F7A3C]"></i>
          <span class="text-sm text-[#50494B] mt-3 font-medium">A carregar dados...</span>
        </div>
      `;
    }
  },

  showEmptyState: (containerId, message = 'Nenhum registo encontrado.') => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <i class="fas fa-inbox text-4xl text-gray-300 mb-2"></i>
          <span class="text-sm text-[#50494B]">${message}</span>
        </div>
      `;
    }
  },

  // ==================================================
  // 4. FORMATADORES
  // ==================================================
  formatCurrency: (value) => {
    const num = Number(value) || 0;
    return `${num.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
  },

  formatDate: (dateString, withTime = true) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    if (withTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('pt-MZ', options);
  },

  // ==================================================
  // 5. LABELS DE ESTADO
  // ==================================================
  getStatusLabel: (status) => {
    const configs = {
      pendente: { text: 'Pendente', bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      atribuido: { text: 'Atribuído', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
      em_progresso: { text: 'Em Progresso', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      recolha_em_progresso: { text: 'Em Recolha', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
      recolha_concluida: { text: 'Recolhido', bg: 'bg-teal-100 text-teal-800 border-teal-200' },
      entrega_em_progresso: { text: 'Em Entrega', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
      concluido: { text: 'Concluído', bg: 'bg-green-100 text-green-800 border-green-200' },
      cancelado: { text: 'Cancelado', bg: 'bg-red-100 text-red-800 border-red-200' }
    };

    const cfg = configs[status] || { text: status, bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    return `<span class="px-2.5 py-0.5 rounded text-xs font-semibold border ${cfg.bg} inline-block">${cfg.text}</span>`;
  },

  getDriverStatusLabel: (status) => {
    const configs = {
      online_livre: { text: 'Online (Livre)', bg: 'bg-green-100 text-green-800' },
      online_ocupado: { text: 'Online (Ocupado)', bg: 'bg-yellow-100 text-yellow-800' },
      em_recolha: { text: 'Em Recolha', bg: 'bg-amber-100 text-amber-800' },
      em_entrega: { text: 'Em Entrega', bg: 'bg-purple-100 text-purple-800' },
      offline: { text: 'Offline', bg: 'bg-gray-100 text-gray-800' }
    };

    const cfg = configs[status] || { text: status, bg: 'bg-gray-100 text-gray-800' };
    return `<span class="px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} inline-block">${cfg.text}</span>`;
  },

  // ==================================================
  // 6. LABELS DE PAGAMENTO
  // ==================================================
  getPaymentLabel: (method) => {
    const names = {
      cash: 'Dinheiro',
      mpesa: 'M-Pesa',
      emola: 'E-Mola',
      mkesh: 'M-Kesh',
      bank_transfer: 'Transferência'
    };
    const name = names[method] || method;
    return `<span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-[#50494B] border border-gray-300 inline-block">${name}</span>`;
  }
};

window.UI = UI;
