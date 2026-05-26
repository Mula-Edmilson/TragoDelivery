// ==================================================
// MÓDULO DE GRÁFICOS DO ADMINISTRADOR (adminCharts.js)
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

window.AdminCharts = AdminCharts;
