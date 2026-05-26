const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Inicializar variáveis de ambiente
dotenv.config();

const connectDB = require('./backend/config/db');
const { validateEnv } = require('./backend/utils');
const { errorHandler } = require('./backend/middleware');
const { User, DriverProfile } = require('./backend/models');
const routes = require('./backend/routes');

// Validar variáveis e conectar à BD
validateEnv();
connectDB();

const app = express();
const server = http.createServer(app);

// Configuração Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// ==================================================
// 1. SEGURANÇA E MIDDLEWARES
// ==================================================
app.use(helmet({
  contentSecurityPolicy: false, // Permite carregar scripts e estilos de CDNs externas
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// ==================================================
// 2. FICHEIROS ESTÁTICOS E UPLOADS
// ==================================================
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));
app.use(express.static(__dirname));

// ==================================================
// 3. ROTAS DA API
// ==================================================
app.use('/api/auth', routes.authRoutes);
app.use('/api/orders', routes.orderRoutes);
app.use('/api/drivers', routes.driverRoutes);
app.use('/api/stats', routes.statsRoutes);
app.use('/api/clients', routes.clientRoutes);
app.use('/api/admin', routes.adminRoutes);
app.use('/api/costs', routes.costRoutes);
app.use('/api/managers', routes.managerRoutes);
app.use('/api/expenses', routes.expenseRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Fallback principal para o Front-end
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================================================
// 4. SOCKET.IO REAL-TIME FLOW
// ==================================================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
    if (!token) {
      return next(new Error('Autenticação WebSocket falhou. Token não fornecido.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'trocar_por_um_segredo_forte');
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('Utilizador não encontrado.'));
    }

    socket.user = { id: user._id.toString(), role: user.role, nome: user.nome };
    next();
  } catch (err) {
    next(new Error('Token inválido ou expirado.'));
  }
});

io.on('connection', async (socket) => {
  console.log(`[Socket] Utilizador ligado: ${socket.user.nome} (${socket.user.role})`);

  if (socket.user.role === 'admin') {
    socket.join('admin_room');
    
    // Enviar as últimas localizações de todos os motoristas online
    try {
      const onlineDrivers = await DriverProfile.find({ status: { $ne: 'offline' } }).populate('user');
      const driversData = onlineDrivers.map(d => ({
        driverId: d._id,
        driverUserId: d.user?._id,
        driverName: d.user?.nome,
        telefone: d.user?.telefone,
        status: d.status,
        lat: d.lastLocation?.lat,
        lng: d.lastLocation?.lng,
        accuracy: d.lastLocation?.accuracy,
        speed: d.lastLocation?.speed,
        updatedAt: d.lastLocation?.updatedAt
      }));
      socket.emit('driver_location_broadcast', { drivers: driversData });
    } catch (e) {
      console.error('Erro ao emitir localizações para admin:', e);
    }
  } else if (socket.user.role === 'driver') {
    socket.join(socket.user.id);
    
    try {
      const profile = await DriverProfile.findOneAndUpdate(
        { user: socket.user.id },
        { status: 'online_livre' },
        { new: true }
      );

      if (profile) {
        io.to('admin_room').emit('driver_status_changed', { driverId: profile._id, status: 'online_livre' });
      }
    } catch (e) {
      console.error('Erro ao atualizar status do motorista ao ligar:', e);
    }

    // Escutar atualizações de localização do motorista
    socket.on('driver_location_update', async (payload) => {
      try {
        const { lat, lng, accuracy, speed } = payload;
        
        const updatedProfile = await DriverProfile.findOneAndUpdate(
          { user: socket.user.id },
          {
            lastLocation: {
              lat, lng, accuracy, speed, updatedAt: new Date()
            }
          },
          { new: true }
        ).populate('user');

        if (updatedProfile) {
          io.to('admin_room').emit('driver_location_broadcast', {
            drivers: [{
              driverId: updatedProfile._id,
              driverUserId: updatedProfile.user?._id,
              driverName: updatedProfile.user?.nome,
              telefone: updatedProfile.user?.telefone,
              status: updatedProfile.status,
              lat, lng, accuracy, speed, updatedAt: new Date()
            }]
          });
        }
      } catch (err) {
        console.error('Erro ao processar atualização de localização:', err);
      }
    });
  }

  socket.on('disconnect', async () => {
    console.log(`[Socket] Utilizador desligado: ${socket.user.nome}`);
    
    if (socket.user.role === 'driver') {
      try {
        const profile = await DriverProfile.findOneAndUpdate(
          { user: socket.user.id },
          { status: 'offline' },
          { new: true }
        );

        if (profile) {
          io.to('admin_room').emit('driver_status_changed', { driverId: profile._id, status: 'offline' });
          io.to('admin_room').emit('driver_disconnected_broadcast', { driverId: profile._id });
        }
      } catch (e) {
        console.error('Erro ao atualizar status para offline:', e);
      }
    }
  });
});

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor Trago Delivery a executar na porta ${PORT} no ambiente ${process.env.NODE_ENV}`);
});
