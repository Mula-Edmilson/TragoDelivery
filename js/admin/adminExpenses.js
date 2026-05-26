// ==================================================
// MÓDULO DE DESPESAS DO ADMINISTRADOR (adminExpenses.js)
// ==================================================

const AdminExpenses = {
  loadExpenses: async () => {
    window.UI.showLoader('expenses-table-container');
    try {
      const expenses = await window.AdminApi.fetchExpenses();
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
              <th class="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y">
      `;

      expenses.forEach(e => {
        const safeCat = e.category.replace(/'/g, "\\'");
        const safeDesc = e.description.replace(/'/g, "\\'");

        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-3">${window.UI.formatDate(e.date, false)}</td>
            <td class="p-3 uppercase text-[10px] font-semibold">${e.category}</td>
            <td class="p-3">${e.description}</td>
            <td class="p-3 font-bold text-red-600">${window.UI.formatCurrency(e.amount)}</td>
            <td class="p-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button onclick="AdminModals.openEditExpenseModal('${e._id}', '${safeCat}', ${e.amount}, '${safeDesc}', '${e.date}')" class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar Valor">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="AdminExpenses.handleDeleteExpense('${e._id}')" class="p-1 text-red-600 hover:bg-red-50 rounded" title="Remover Registo">
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
      window.UI.showEmptyState('expenses-table-container', 'Erro ao carregar despesas.');
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
      await window.AdminApi.createExpense(expenseData);
      window.UI.showAlert('Despesa lançada com sucesso!');
      form.reset();
      AdminExpenses.loadExpenses();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleUpdateExpense: async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const expenseData = {
      category: form.category.value.trim(),
      description: form.description.value.trim(),
      amount: Number(form.amount.value),
      date: form.date.value || new Date()
    };

    try {
      await window.AdminApi.updateExpense(id, expenseData);
      window.UI.showAlert('Despesa atualizada com sucesso!');
      window.UI.closeModal('modal-edit-expense');
      AdminExpenses.loadExpenses();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  },

  handleDeleteExpense: async (id) => {
    if (!confirm('Tem a certeza que deseja remover esta despesa?')) return;
    try {
      await window.AdminApi.deleteExpense(id);
      window.UI.showAlert('Despesa removida.');
      AdminExpenses.loadExpenses();
    } catch (err) {
      window.UI.showAlert(err.message, 'error');
    }
  }
};

window.AdminExpenses = AdminExpenses;
