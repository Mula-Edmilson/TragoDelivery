const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');
const { User } = require('../models');

// ==================================================
// 1. AUTHENTICATION & AUTHORIZATION
// ==================================================
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'trocar_por_um_segredo_forte');
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'Utilizador não encontrado.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Não autorizado. Token inválido ou expirado.' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
};

const driver = (req, res, next) => {
  if (req.user && req.user.role === 'driver') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas motoristas.' });
  }
};

const manager = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas gestores.' });
  }
};

const adminOrManager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas administradores ou gestores.' });
  }
};

// ==================================================
// 2. RATE LIMITER
// ==================================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 500, // limite de 500 requests por IP
  message: { message: 'Demasiados pedidos a partir deste IP. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================================================
// 3. REQUEST VALIDATION
// ==================================================
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Erros de validação nos dados fornecidos.', 
      errors: errors.array() 
    });
  }
  next();
};

// ==================================================
// 4. GLOBAL ERROR HANDLER
// ==================================================
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Erro do Mongoose de ID mal formatado
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Recurso não encontrado.';
  }

  // Erro de duplicação de chave no Mongoose
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Já existe um registo com estes dados únicos no sistema.';
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  protect,
  admin,
  driver,
  manager,
  adminOrManager,
  apiLimiter,
  validateRequest,
  errorHandler
};
