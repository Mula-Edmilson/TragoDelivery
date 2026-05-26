const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { 
  User, DriverProfile, Client, Order, CompanyCost, Expense, Trip 
} = require('../models');
const { 
  generateVerificationCode, calculateOrderValues, exportFinancialExcel, SERVICE_TYPES 
} = require('../utils');

// ==================================================
// 1. AUTH CONTROLLER
// ==================================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('profile');
    res.json({
      id: user._id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      profile: user.profile
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter dados do utilizador.' });
  }
};

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Forneça email, password e role.' });
  }

  try {
    const user = await User.findOne({ email, role }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas ou role incorreta.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, nome: user.nome },
      process.env.JWT_SECRET || 'trocar_por_um_segredo_forte',
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login efetuado com sucesso.',
      token,
      user: {
        _id: user._id,
        nome: user.nome,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno no servidor ao fazer login.' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout efetuado com sucesso.' });
};

const changePassword = async (req, res) => {
  const { senhaAntiga, senhaNova } = req.body;

  if (!senhaAntiga || !senhaNova) {
    return res.status(400).json({ message: 'Forneça a senha antiga e a nova.' });
  }

  try {
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await bcrypt.compare(senhaAntiga, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'A senha antiga está incorreta.' });
    }

    user.password = await bcrypt.hash(senhaNova, 12);
    await user.save();

    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao alterar a senha.' });
  }
};

const registerDriver = async (req, res) => {
  const { nome, email, telefone, password, vehicle_plate, commissionRate } = req.body;

  if (!nome || !email || !telefone || !password) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está registado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      nome,
      email,
      telefone,
      password: hashedPassword,
      role: 'driver'
    });

    const profile = await DriverProfile.create({
      user: user._id,
      vehicle_plate,
      commissionRate: commissionRate || 20,
      status: 'offline'
    });

    res.status(201).json({
      message: 'Motorista registado com sucesso.',
      user: { _id: user._id, nome: user.nome, email: user.email },
      profile
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registar o motorista.' });
  }
};

// ==================================================
// 2. ORDER CONTROLLER
// ==================================================
const createOrder = async (req, res) => {
  try {
    const {
      service_type, client_name, client_phone1, client_phone2,
      price, address_text, lat, lng, clientId, autoAssign, payment_method
    } = req.body;

    if (!service_type || !client_name || !client_phone1 || !price || !address_text || !lat || !lng || !payment_method) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios da encomenda.' });
    }

    let image_url = null;
    if (req.file) {
      const filename = `order-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const filepath = path.join(__dirname, '../../uploads', filename);

      // Assegurar diretório
      if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
        fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
      }

      await sharp(req.file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);

      image_url = `/uploads/${filename}`;
    }

    const verification_code = generateVerificationCode();

    const orderData = {
      service_type,
      price: Number(price),
      client_name,
      client_phone1,
      client_phone2,
      address_text,
      address_coords: { lat: Number(lat), lng: Number(lng) },
      image_url,
      verification_code,
      created_by_admin: req.user.id,
      payment_method,
      status: 'pendente'
    };

    if (clientId) orderData.client = clientId;

    let assignedDriver = null;

    if (autoAssign === 'true' || autoAssign === true) {
      // Procurar motorista online_livre mais próximo
      const drivers = await DriverProfile.find({ status: 'online_livre' }).populate('user');
      
      let minDistance = Infinity;
      
      drivers.forEach(d => {
        if (d.lastLocation && d.lastLocation.lat && d.lastLocation.lng) {
          const dist = Math.hypot(d.lastLocation.lat - Number(lat), d.lastLocation.lng - Number(lng));
          if (dist < minDistance) {
            minDistance = dist;
            assignedDriver = d;
          }
        }
      });

      if (!assignedDriver && drivers.length > 0) {
        assignedDriver = drivers[0];
      }

      if (assignedDriver) {
        orderData.assigned_to_driver = assignedDriver._id;
        orderData.status = 'atribuido';
      }
    }

    const order = await Order.create(orderData);

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('order_pending', order);
      
      if (assignedDriver) {
        io.to(assignedDriver.user._id.toString()).emit('nova_entrega_atribuida', order);
      }
    }

    res.status(201).json({
      message: 'Encomenda criada com sucesso.',
      order
    });
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    res.status(500).json({ message: 'Erro ao criar a encomenda.' });
  }
};

const getMyDeliveries = async (req, res) => {
  try {
    const profile = await DriverProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Perfil de motorista não encontrado.' });
    }

    const orders = await Order.find({
      assigned_to_driver: profile._id,
      status: { $nin: ['concluido', 'cancelado'] }
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar as entregas.' });
  }
};

const pickupStart = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada.' });

    order.status = 'recolha_em_progresso';
    order.pickupStartAt = Date.now();
    order.timestamp_started = Date.now();
    await order.save();

    const profile = await DriverProfile.findById(order.assigned_to_driver);
    if (profile) {
      profile.status = 'em_recolha';
      await profile.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('pickup_started', order);
      io.to('admin_room').emit('driver_status_changed', { driverId: profile._id, status: 'em_recolha' });
    }

    res.json({ message: 'Recolha iniciada.', order });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao iniciar recolha.' });
  }
};

const pickupComplete = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada.' });

    order.status = 'recolha_concluida';
    order.pickupCompletedAt = Date.now();
    await order.save();

    const profile = await DriverProfile.findById(order.assigned_to_driver);
    if (profile) {
      profile.status = 'online_ocupado';
      await profile.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('pickup_completed', order);
      io.to('admin_room').emit('driver_status_changed', { driverId: profile._id, status: 'online_ocupado' });
    }

    res.json({ message: 'Recolha concluída.', order });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao concluir recolha.' });
  }
};

const deliveryStart = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada.' });

    order.status = 'entrega_em_progresso';
    order.deliveryStartAt = Date.now();
    await order.save();

    const profile = await DriverProfile.findById(order.assigned_to_driver);
    if (profile) {
      profile.status = 'em_entrega';
      await profile.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('delivery_started', order);
      io.to('admin_room').emit('driver_status_changed', { driverId: profile._id, status: 'em_entrega' });
    }

    res.json({ message: 'Entrega iniciada.', order });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao iniciar entrega.' });
  }
};

const deliveryComplete = async (req, res) => {
  try {
    const { verification_code } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada.' });

    if (order.verification_code.toUpperCase() !== verification_code.toUpperCase()) {
      return res.status(400).json({ message: 'Código de verificação incorreto.' });
    }

    const profile = await DriverProfile.findById(order.assigned_to_driver);
    const commissionRate = profile ? profile.commissionRate : 20;

    const { valor_motorista, valor_empresa } = calculateOrderValues(order.price, commissionRate);

    order.status = 'concluido';
    order.deliveryCompletedAt = Date.now();
    order.timestamp_completed = Date.now();
    order.valor_motorista = valor_motorista;
    order.valor_empresa = valor_empresa;
    await order.save();

    if (profile) {
      profile.status = 'online_livre';
      await profile.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('delivery_completed', order);
      if (profile) {
        io.to('admin_room').emit('driver_status_changed', { driverId: profile._id, status: 'online_livre' });
      }
    }

    res.json({ message: 'Entrega finalizada com sucesso.', order });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao finalizar entrega.' });
  }
};

const assignOrder = async (req, res) => {
  try {
    const { driverId } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada.' });

    const oldDriverId = order.assigned_to_driver;
    order.assigned_to_driver = driverId;
    order.status = order.status === 'pendente' ? 'atribuido' : order.status;
    await order.save();

    const newDriver = await DriverProfile.findById(driverId).populate('user');
    const io = req.app.get('io');

    if (io) {
      if (oldDriverId) {
        const oldDriver = await DriverProfile.findById(oldDriverId).populate('user');
        if (oldDriver) {
          io.to(oldDriver.user._id.toString()).emit('entrega_cancelada', { orderId: order._id });
        }
      }

      if (newDriver) {
        io.to(newDriver.user._id.toString()).emit('nova_entrega_atribuida', order);
      }

      io.to('admin_room').emit('order_pending', order);
    }

    res.json({ message: 'Encomenda atribuída com sucesso.', order });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atribuir encomenda.' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada.' });

    const driverId = order.assigned_to_driver;

    order.status = 'cancelado';
    order.cancelledAt = Date.now();
    order.cancelledBy = req.user.id;
    order.cancelReason = reason || 'Cancelado pelo Administrador';
    await order.save();

    if (driverId) {
      const profile = await DriverProfile.findById(driverId).populate('user');
      if (profile) {
        profile.status = 'online_livre';
        await profile.save();

        const io = req.app.get('io');
        if (io) {
          io.to(profile.user._id.toString()).emit('entrega_cancelada', { orderId: order._id });
          io.to('admin_room').emit('driver_status_changed', { driverId: profile._id, status: 'online_livre' });
        }
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('order_canceled', order);
    }

    res.json({ message: 'Encomenda cancelada.', order });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cancelar a encomenda.' });
  }
};

const getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $nin: ['concluido', 'cancelado'] }
    }).populate('assigned_to_driver').populate('client').sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar encomendas ativas.' });
  }
};

const getHistoryOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['concluido', 'cancelado'] }
    }).populate('assigned_to_driver').populate('client').sort({ timestamp_completed: -1, createdAt: -1 }).limit(200);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar histórico.' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('assigned_to_driver').populate('client').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar encomendas.' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('assigned_to_driver').populate('client');
    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada.' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter encomenda.' });
  }
};

// ==================================================
// 3. DRIVER CONTROLLER
// ==================================================
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).populate('profile');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar motoristas.' });
  }
};

const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await DriverProfile.find({ status: 'online_livre' }).populate('user');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar motoristas disponíveis.' });
  }
};

const getMyEarnings = async (req, res) => {
  try {
    const profile = await DriverProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Perfil não encontrado.' });

    const orders = await Order.find({
      assigned_to_driver: profile._id,
      status: 'concluido'
    }).sort({ timestamp_completed: -1 });

    let totalGanhos = 0;
    orders.forEach(o => totalGanhos += (o.valor_motorista || 0));

    res.json({
      commissionRate: profile.commissionRate,
      totalGanhos,
      totalOrders: orders.length,
      ordersList: orders
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter ganhos.' });
  }
};

const getLiveLocations = async (req, res) => {
  try {
    const profiles = await DriverProfile.find({
      status: { $ne: 'offline' }
    }).populate('user');

    const drivers = profiles.map(p => ({
      driverId: p._id,
      driverUserId: p.user ? p.user._id : null,
      driverName: p.user ? p.user.nome : 'Desconhecido',
      telefone: p.user ? p.user.telefone : '',
      status: p.status,
      lat: p.lastLocation ? p.lastLocation.lat : null,
      lng: p.lastLocation ? p.lastLocation.lng : null,
      accuracy: p.lastLocation ? p.lastLocation.accuracy : null,
      speed: p.lastLocation ? p.lastLocation.speed : null,
      updatedAt: p.lastLocation ? p.lastLocation.updatedAt : null
    }));

    res.json({ drivers });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter localizações.' });
  }
};

const getDriverReport = async (req, res) => {
  try {
    const orders = await Order.find({
      assigned_to_driver: req.params.id,
      status: 'concluido'
    }).sort({ timestamp_completed: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter relatório do motorista.' });
  }
};

const getDriverById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'driver' }).populate('profile');
    if (!user) return res.status(404).json({ message: 'Motorista não encontrado.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter motorista.' });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { nome, telefone, vehicle_plate, status, commissionRate } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'driver' },
      { nome, telefone },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'Motorista não encontrado.' });

    const profile = await DriverProfile.findOneAndUpdate(
      { user: user._id },
      { vehicle_plate, status, commissionRate },
      { new: true }
    );

    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar motorista.' });
  }
};

// ==================================================
// 4. CLIENT CONTROLLER
// ==================================================
const createClient = async (req, res) => {
  try {
    const { nome, telefone, email, empresa, nuit, endereco } = req.body;
    const client = await Client.create({
      nome, telefone, email, empresa, nuit, endereco, created_by_admin: req.user.id
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar cliente.' });
  }
};

const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar clientes.' });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente não encontrado.' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter cliente.' });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ message: 'Cliente não encontrado.' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar cliente.' });
  }
};

const deleteClient = async (req, res) => {
  try {
    const ordersCount = await Order.countDocuments({ client: req.params.id });
    if (ordersCount > 0) {
      return res.status(400).json({ message: 'Não é possível remover clientes com encomendas associadas.' });
    }

    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cliente removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover cliente.' });
  }
};

const getClientStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { client: req.params.id, status: 'concluido' };

    if (startDate && endDate) {
      query.timestamp_completed = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    const orders = await Order.find(query).sort({ timestamp_completed: -1 });
    let totalValue = 0;
    orders.forEach(o => totalValue += o.price);

    res.json({ totalValue, totalOrders: orders.length, ordersList: orders });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar extrato do cliente.' });
  }
};

// ==================================================
// 5. COST CONTROLLER
// ==================================================
const createCost = async (req, res) => {
  try {
    const { category, amount, description, date, assignedUserId, assignedClientId } = req.body;
    const cost = await CompanyCost.create({
      category, amount, description, date, 
      createdBy: req.user.id,
      assignedUser: assignedUserId || null,
      assignedClient: assignedClientId || null
    });
    res.status(201).json(cost);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registar custo.' });
  }
};

const getAllCosts = async (req, res) => {
  try {
    const { month, limit } = req.query;
    const query = {};

    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    let costsQuery = CompanyCost.find(query).populate('assignedUser').populate('assignedClient').sort({ date: -1 });
    if (limit) costsQuery = costsQuery.limit(Number(limit));

    const costs = await costsQuery;
    res.json(costs);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar custos.' });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const monthsCount = Number(req.query.months) || 6;
    const now = new Date();
    
    // Mês atual
    const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentCosts = await CompanyCost.find({ date: { $gte: startCurrent } });

    let totalCostsCurrent = 0;
    const costsByCategory = {};

    currentCosts.forEach(c => {
      totalCostsCurrent += c.amount;
      costsByCategory[c.category] = (costsByCategory[c.category] || 0) + c.amount;
    });

    // Histórico
    const labels = [];
    const revenue = [];
    const costs = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      
      const monthLabel = mStart.toLocaleString('pt-PT', { month: 'short', year: 'numeric' });
      labels.push(monthLabel);

      // Receita do mês
      const mOrders = await Order.find({
        status: 'concluido',
        timestamp_completed: { $gte: mStart, $lte: mEnd }
      });
      let mRev = 0;
      mOrders.forEach(o => mRev += (o.valor_empresa || 0));
      revenue.push(mRev);

      // Custos do mês
      const mCosts = await CompanyCost.find({ date: { $gte: mStart, $lte: mEnd } });
      let mCost = 0;
      mCosts.forEach(c => mCost += c.amount);

      const mExpenses = await Expense.find({ date: { $gte: mStart, $lte: mEnd } });
      mExpenses.forEach(e => mCost += e.amount);

      costs.push(mCost);
    }

    res.json({
      currentMonth: {
        label: startCurrent.toLocaleString('pt-PT', { month: 'long', year: 'numeric' }),
        totalCosts: totalCostsCurrent,
        costsByCategory
      },
      history: { labels, revenue, costs }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter resumo de custos.' });
  }
};

// ==================================================
// 6. MANAGER CONTROLLER
// ==================================================
const createManager = async (req, res) => {
  try {
    const { nome, email, telefone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);

    const manager = await User.create({
      nome, email, telefone, password: hashedPassword, role: 'manager'
    });

    res.status(201).json({ _id: manager._id, nome: manager.nome, email: manager.email });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar gestor.' });
  }
};

const getAllManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager' });
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar gestores.' });
  }
};

const getManagerById = async (req, res) => {
  try {
    const manager = await User.findOne({ _id: req.params.id, role: 'manager' });
    if (!manager) return res.status(404).json({ message: 'Gestor não encontrado.' });
    res.json(manager);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter gestor.' });
  }
};

const updateManager = async (req, res) => {
  try {
    const { nome, telefone, email, password } = req.body;
    const updateData = { nome, telefone, email };

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const manager = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'manager' },
      updateData,
      { new: true }
    );

    res.json(manager);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar gestor.' });
  }
};

const deleteManager = async (req, res) => {
  try {
    await User.findOneAndDelete({ _id: req.params.id, role: 'manager' });
    res.json({ message: 'Gestor removido.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover gestor.' });
  }
};

// ==================================================
// 7. EXPENSE CONTROLLER
// ==================================================
const createExpense = async (req, res) => {
  try {
    const { category, description, amount, date, employee } = req.body;
    const expense = await Expense.create({
      category, description, amount, date, employee, created_by: req.user.id
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao lançar despesa.' });
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }
    if (category) query.category = category;

    const expenses = await Expense.find(query).populate('employee').populate('created_by').sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar despesas.' });
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const expenses = await Expense.find({});
    let total = 0;
    const byCategory = {};

    expenses.forEach(e => {
      total += e.amount;
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    res.json({ total, byCategory });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao resumir despesas.' });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar despesa.' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Despesa removida.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover despesa.' });
  }
};

// ==================================================
// 8. STATS CONTROLLER
// ==================================================
const getOverview = async (req, res) => {
  try {
    const pendentes = await Order.countDocuments({ status: { $in: ['pendente', 'atribuido'] } });
    const emTransito = await Order.countDocuments({ status: { $in: ['em_progresso', 'recolha_em_progresso', 'recolha_concluida', 'entrega_em_progresso'] } });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const concluidasHoje = await Order.countDocuments({ status: 'concluido', timestamp_completed: { $gte: startOfDay } });

    const motoristasOnline = await DriverProfile.countDocuments({ status: { $ne: 'offline' } });

    res.json({ pendentes, emTransito, concluidasHoje, motoristasOnline });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar métricas gerais.' });
  }
};

const getServices = async (req, res) => {
  try {
    const orders = await Order.find({});
    const counts = {};
    
    orders.forEach(o => {
      counts[o.service_type] = (counts[o.service_type] || 0) + 1;
    });

    const labels = Object.keys(SERVICE_TYPES).map(k => SERVICE_TYPES[k]);
    const dataValues = Object.keys(SERVICE_TYPES).map(k => counts[k] || 0);
    const adesaoValues = dataValues.map(v => orders.length ? Math.round((v / orders.length) * 100) : 0);

    res.json({ labels, dataValues, adesaoValues });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar estatísticas de serviços.' });
  }
};

const getFinancials = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const orders = await Order.find({
      status: 'concluido',
      timestamp_completed: { $gte: startOfMonth }
    }).populate({
      path: 'assigned_to_driver',
      populate: { path: 'user' }
    });

    let totalReceita = 0;
    let totalGanhosMotorista = 0;
    let totalLucroEmpresa = 0;
    const driverEarnings = {};

    orders.forEach(o => {
      totalReceita += o.price;
      totalGanhosMotorista += (o.valor_motorista || 0);
      totalLucroEmpresa += (o.valor_empresa || 0);

      if (o.assigned_to_driver) {
        const dId = o.assigned_to_driver._id.toString();
        driverEarnings[dId] = (driverEarnings[dId] || 0) + (o.valor_motorista || 0);
      }
    });

    let topDriver = null;
    let maxEarning = -1;

    for (const dId in driverEarnings) {
      if (driverEarnings[dId] > maxEarning) {
        maxEarning = driverEarnings[dId];
        const orderWithDriver = orders.find(o => o.assigned_to_driver && o.assigned_to_driver._id.toString() === dId);
        if (orderWithDriver && orderWithDriver.assigned_to_driver.user) {
          topDriver = orderWithDriver.assigned_to_driver.user.nome;
        }
      }
    }

    res.json({
      totalReceita,
      totalGanhosMotorista,
      totalLucroEmpresa,
      topDriver: topDriver || 'Nenhum'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar finanças.' });
  }
};

// ==================================================
// 9. ADMIN CONTROLLER
// ==================================================
const deleteHistory = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Order.deleteMany({
      status: { $in: ['concluido', 'cancelado'] },
      timestamp_completed: { $lte: thirtyDaysAgo }
    });

    res.json({ message: `Histórico limpo. ${result.deletedCount} registos removidos.` });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao limpar histórico.' });
  }
};

const exportFinancial = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Forneça startDate e endDate.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    const orders = await Order.find({
      status: 'concluido',
      timestamp_completed: { $gte: start, $lte: end }
    });

    const costs = await CompanyCost.find({
      date: { $gte: start, $lte: end }
    });

    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    });

    const buffer = await exportFinancialExcel({ orders, costs, expenses, startDate, endDate });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Financeiro_${startDate}_${endDate}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao exportar finanças:', error);
    res.status(500).json({ message: 'Erro ao exportar relatório financeiro.' });
  }
};

const getDriverTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ driver: req.params.driverId }).sort({ startedAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar viagens do motorista.' });
  }
};

const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('driver').populate('order');
    if (!trip) return res.status(404).json({ message: 'Viagem não encontrada.' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter viagem.' });
  }
};

module.exports = {
  // Auth
  getMe, login, logout, changePassword, registerDriver,
  // Orders
  createOrder, getMyDeliveries, pickupStart, pickupComplete, deliveryStart, deliveryComplete,
  assignOrder, cancelOrder, getActiveOrders, getHistoryOrders, getAllOrders, getOrderById,
  // Drivers
  getAllDrivers, getAvailableDrivers, getMyEarnings, getLiveLocations, getDriverReport, getDriverById, updateDriver,
  // Clients
  createClient, getAllClients, getClientById, updateClient, deleteClient, getClientStatement,
  // Costs
  createCost, getAllCosts, getDashboardSummary,
  // Managers
  createManager, getAllManagers, getManagerById, updateManager, deleteManager,
  // Expenses
  createExpense, getAllExpenses, getExpenseSummary, updateExpense, deleteExpense,
  // Stats
  getOverview, getServices, getFinancials,
  // Admin
  deleteHistory, exportFinancial, getDriverTrips, getTripById
};
