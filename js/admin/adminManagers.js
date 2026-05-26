// ==================================================
// MÓDULO DE GESTORES DO ADMINISTRADOR (adminManagers.js)
// ==================================================

const AdminManagers = {
  loadManagers: async () => {
    window.UI.showLoader('managers-table-container');
    try {
      const managers = await window.AdminApi.fetchManagers();
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
        // Escapar as strings para passar com segurança na chamada inline
        const safeNome = m.nome.replace(/'/g, "\\'");
        const safeEmail = m.email.replace(/'/g, "\\'");
        const safePhone = m.telefone.replace(/'/g, "\\'");

        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-3 font-bold text-[#2F7A3C]">${m.nome}</td>
            <td class="p-3">${m.email}</td>
            <td class="p-3">${m.telefone}</td>
            <td class="p-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button onclick="AdminModals.openEditManagerModal('${m._id}', '${safeNome}', '${safeEmail}', '${safePhone}')" class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar Dados">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="AdminManagers.handleDeleteManager('${m._id}')" class="p-1 text-red-600 hover:bg-red-50 rounded" title="Remover Gestor">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
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
      await window.AdminApi.createManager(managerData);
      window.UI.showAlert('Gestor criado com sucesso!');
      form.reset();
      AdminManagers.loadManagers();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleUpdateManager: async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const managerData = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim()
    };

    if (form.password.value) {
      managerData.password = form.password.value;
    }

    try {
      await window.AdminApi.updateManager(id, managerData);
      window.UI.showAlert('Dados do gestor atualizados com sucesso!');
      window.UI.closeModal('modal-edit-manager');
      AdminManagers.loadManagers();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleDeleteManager: async (id) => {
    if (!confirm('Tem a certeza que deseja remover este gestor?')) return;
    try {
      await window.AdminApi.deleteManager(id);
      window.UI.showAlert('Gestor removido.');
      AdminManagers.loadManagers();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  }
};

window.AdminManagers = AdminManagers;
