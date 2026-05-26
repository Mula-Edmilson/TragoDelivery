const mongoose = require('mongoose');
const { ROLES, DRIVER_STATUSES, ORDER_STATUSES, PAYMENT_METHODS, COST_CATEGORIES } = require('../utils');

// ==================================================
// 1. USER MODEL
// ==================================================
const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  telefone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, required: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('profile', {
  ref: 'DriverProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

const User = mongoose.model('User', userSchema);

// ==================================================
// 2. DRIVER PROFILE MODEL
// ==================================================
const driverProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicle_plate: { type: String, trim: true },
  status: { type: String, enum: DRIVER_STATUSES, default: 'offline' },
  commissionRate: { type: Number, default: 20 },
  lastLocation: {
    lat: { type: Number },
    lng: { type: Number },
    accuracy: { type: Number },
    speed: { type: Number },
    updatedAt: { type: Date }
  }
}, { timestamps: true });

const DriverProfile = mongoose.model('DriverProfile', driverProfileSchema);

// ==================================================
// 3. CLIENT MODEL
// ==================================================
const clientSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  telefone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  empresa: { type: String, trim: true },
  nuit: { type: String, trim: true },
  endereco: { type: String, trim: true },
  created_by_admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

// ==================================================
// 4. ORDER MODEL
// ==================================================
const orderSchema = new mongoose.Schema({
  service_type: { type: String, required: true },
  price: { type: Number, required: true },
  client_name: { type: String, required: true },
  client_phone1: { type: String, required: true },
  client_phone2: { type: String },
  address_text: { type: String, required: true },
  address_coords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  image_url: { type: String },
  verification_code: { type: String, required: true },
  created_by_admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_to_driver: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  status: { type: String, enum: ORDER_STATUSES, default: 'pendente' },
  
  // Timestamps de Fluxo
  timestamp_started: { type: Date },
  timestamp_completed: { type: Date },
  pickupStartAt: { type: Date },
  pickupCompletedAt: { type: Date },
  deliveryStartAt: { type: Date },
  deliveryCompletedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelReason: { type: String },
  
  // Dados Financeiros
  valor_motorista: { type: Number },
  valor_empresa: { type: Number },
  payment_method: { type: String, enum: PAYMENT_METHODS, required: true }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// ==================================================
// 5. COMPANY COST MODEL
// ==================================================
const companyCostSchema = new mongoose.Schema({
  category: { type: String, enum: COST_CATEGORIES, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }
}, { timestamps: true });

const CompanyCost = mongoose.model('CompanyCost', companyCostSchema);

// ==================================================
// 6. EXPENSE MODEL
// ==================================================
const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

// ==================================================
// 7. TRIP MODEL
// ==================================================
const tripSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type: { 
    type: String, 
    enum: ['coleta', 'entrega', 'retorno_central', 'pausa', 'outro'],
    default: 'entrega' 
  },
  status: { 
    type: String, 
    enum: ['em_andamento', 'concluida', 'cancelada'],
    default: 'em_andamento'
  },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
  origin: { type: String },
  destination: { type: String },
  positions: [{
    lat: { type: Number },
    lng: { type: Number },
    speed: { type: Number },
    heading: { type: Number },
    accuracy: { type: Number },
    recordedAt: { type: Date, default: Date.now }
  }],
  metrics: {
    distance: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    avgSpeed: { type: Number, default: 0 },
    maxSpeed: { type: Number, default: 0 }
  },
  notes: { type: String }
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = {
  User,
  DriverProfile,
  Client,
  Order,
  CompanyCost,
  Expense,
  Trip
};
