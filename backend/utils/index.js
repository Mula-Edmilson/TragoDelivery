const exceljs = require('exceljs');

// ==================================================
// 1. CONSTANTS
// ==================================================
const DEFAULT_COMMISSION_RATE = 20;

const ROLES = ['admin', 'driver', 'manager'];

const DRIVER_STATUSES = [
  'online_livre',
  'online_ocupado',
  'em_recolha',
  'em_entrega',
  'offline'
];

const ORDER_STATUSES = [
  'pendente',
  'atribuido',
  'em_progresso',
  'recolha_em_progresso',
  'recolha_concluida',
  'entrega_em_progresso',
  'concluido',
  'cancelado'
];

const PAYMENT_METHODS = [
  'cash',
  'mpesa',
  'emola',
  'mkesh',
  'bank_transfer'
];

const COST_CATEGORIES = [
  'salarios',
  'renda',
  'manutencao',
  'comunicacao',
  'marketing',
  'combustivel',
  'diversos'
];

const SERVICE_TYPES = {
  rapido: 'Delivery Rápido',
  doc: 'Doc.',
  farma: 'Farmácia',
  carga: 'Cargas',
  outros: 'Outros'
};

// ==================================================
// 2. HELPERS
// ==================================================
const generateVerificationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const calculateOrderValues = (price, commissionRate = DEFAULT_COMMISSION_RATE) => {
  const valor_motorista = (price * commissionRate) / 100;
  const valor_empresa = price - valor_motorista;
  return { valor_motorista, valor_empresa };
};

// ==================================================
// 3. VALIDATE ENV
// ==================================================
const validateEnv = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  required.forEach((varName) => {
    if (!process.env[varName]) {
      console.warn(`Aviso: Variável de ambiente obrigatória ${varName} não está definida. Usando fallback seguro para desenvolvimento.`);
    }
  });
};

// ==================================================
// 4. EXCEL EXPORT
// ==================================================
const exportFinancialExcel = async ({ orders, costs, expenses, startDate, endDate }) => {
  const workbook = new exceljs.Workbook();
  
  // Folha 1: Resumo Financeiro
  const summarySheet = workbook.addWorksheet('Resumo Financeiro');
  summarySheet.columns = [
    { header: 'Métrica', key: 'metric', width: 30 },
    { header: 'Valor (MZN)', key: 'value', width: 20 }
  ];
  
  let totalRevenue = 0;
  let totalDriverEarnings = 0;
  let totalCompanyProfit = 0;
  
  orders.forEach(o => {
    totalRevenue += o.price || 0;
    totalDriverEarnings += o.valor_motorista || 0;
    totalCompanyProfit += o.valor_empresa || 0;
  });

  let totalCosts = 0;
  costs.forEach(c => totalCosts += c.amount || 0);

  let totalExpenses = 0;
  expenses.forEach(e => totalExpenses += e.amount || 0);

  const finalBalance = totalCompanyProfit - totalCosts - totalExpenses;

  summarySheet.addRows([
    { metric: 'Período', value: `${startDate} até ${endDate}` },
    { metric: 'Total de Encomendas Concluídas', value: orders.length },
    { metric: 'Receita Bruta Total', value: totalRevenue },
    { metric: 'Ganhos dos Motoristas', value: totalDriverEarnings },
    { metric: 'Lucro Bruto da Empresa', value: totalCompanyProfit },
    { metric: 'Custos Operacionais', value: totalCosts },
    { metric: 'Despesas de Gestão', value: totalExpenses },
    { metric: 'Saldo Líquido', value: finalBalance }
  ]);

  // Estilizar cabeçalho
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F7A3C' } };

  // Folha 2: Encomendas
  const ordersSheet = workbook.addWorksheet('Encomendas Concluídas');
  ordersSheet.columns = [
    { header: 'ID', key: 'id', width: 25 },
    { header: 'Cliente', key: 'client', width: 25 },
    { header: 'Serviço', key: 'service', width: 20 },
    { header: 'Preço', key: 'price', width: 15 },
    { header: 'Valor Motorista', key: 'driver_val', width: 18 },
    { header: 'Valor Empresa', key: 'company_val', width: 18 },
    { header: 'Método Pagamento', key: 'payment', width: 18 },
    { header: 'Data Conclusão', key: 'date', width: 22 }
  ];

  ordersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  ordersSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F7A3C' } };

  orders.forEach(o => {
    ordersSheet.addRow({
      id: o._id.toString(),
      client: o.client_name,
      service: SERVICE_TYPES[o.service_type] || o.service_type,
      price: o.price,
      driver_val: o.valor_motorista,
      company_val: o.valor_empresa,
      payment: o.payment_method,
      date: o.timestamp_completed ? new Date(o.timestamp_completed).toLocaleString() : ''
    });
  });

  // Folha 3: Custos e Despesas
  const costsSheet = workbook.addWorksheet('Custos e Despesas');
  costsSheet.columns = [
    { header: 'Tipo', key: 'type', width: 15 },
    { header: 'Categoria', key: 'category', width: 20 },
    { header: 'Descrição', key: 'description', width: 30 },
    { header: 'Valor', key: 'amount', width: 15 },
    { header: 'Data', key: 'date', width: 20 }
  ];

  costsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  costsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C97813' } };

  costs.forEach(c => {
    costsSheet.addRow({
      type: 'Custo da Empresa',
      category: c.category,
      description: c.description,
      amount: c.amount,
      date: c.date ? new Date(c.date).toLocaleDateString() : ''
    });
  });

  expenses.forEach(e => {
    costsSheet.addRow({
      type: 'Despesa Lançada',
      category: e.category,
      description: e.description,
      amount: e.amount,
      date: e.date ? new Date(e.date).toLocaleDateString() : ''
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  DEFAULT_COMMISSION_RATE,
  ROLES,
  DRIVER_STATUSES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  COST_CATEGORIES,
  SERVICE_TYPES,
  generateVerificationCode,
  calculateOrderValues,
  validateEnv,
  exportFinancialExcel
};
