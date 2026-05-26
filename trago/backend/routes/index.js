const express = require('express');
const multer = require('multer');
const { 
  protect, admin, driver, adminOrManager, apiLimiter 
} = require('../middleware');
const controllers = require('../controllers');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.UPLOAD_IMAGE_MAX_SIZE) || 5242880 }
});

// ==================================================
// 1. AUTH ROUTES
// ==================================================
const authRoutes = express.Router();
authRoutes.get('/me', protect, controllers.getMe);
authRoutes.post('/login', apiLimiter, controllers.login);
authRoutes.post('/logout', protect, controllers.logout);
authRoutes.put('/change-password', protect, controllers.changePassword);
authRoutes.post('/register-driver', protect, admin, controllers.registerDriver);

// ==================================================
// 2. ORDER ROUTES
// ==================================================
const orderRoutes = express.Router();
orderRoutes.post('/', protect, admin, upload.single('image'), controllers.createOrder);
orderRoutes.get('/my-deliveries', protect, driver, controllers.getMyDeliveries);
orderRoutes.post('/:id/pickup-start', protect, driver, controllers.pickupStart);
orderRoutes.post('/:id/pickup-complete', protect, driver, controllers.pickupComplete);
orderRoutes.post('/:id/delivery-start', protect, driver, controllers.deliveryStart);
orderRoutes.post('/:id/delivery-complete', protect, driver, controllers.deliveryComplete);
// Aliases
orderRoutes.post('/:id/start', protect, driver, controllers.pickupStart);
orderRoutes.post('/:id/complete', protect, driver, controllers.deliveryComplete);

orderRoutes.put('/:orderId/assign', protect, admin, controllers.assignOrder);
orderRoutes.post('/:id/cancel', protect, admin, controllers.cancelOrder);
orderRoutes.get('/active', protect, admin, controllers.getActiveOrders);
orderRoutes.get('/history', protect, admin, controllers.getHistoryOrders);
orderRoutes.get('/', protect, admin, controllers.getAllOrders);
orderRoutes.get('/:id', protect, admin, controllers.getOrderById);

// ==================================================
// 3. DRIVER ROUTES
// ==================================================
const driverRoutes = express.Router();
driverRoutes.get('/', protect, admin, controllers.getAllDrivers);
driverRoutes.get('/available', protect, admin, controllers.getAvailableDrivers);
driverRoutes.get('/my-earnings', protect, driver, controllers.getMyEarnings);
driverRoutes.get('/live-locations', protect, admin, controllers.getLiveLocations);
driverRoutes.get('/:id/report', protect, admin, controllers.getDriverReport);
driverRoutes.get('/:id', protect, admin, controllers.getDriverById);
driverRoutes.put('/:id', protect, admin, controllers.updateDriver);

// ==================================================
// 4. CLIENT ROUTES
// ==================================================
const clientRoutes = express.Router();
clientRoutes.post('/', protect, admin, controllers.createClient);
clientRoutes.get('/', protect, admin, controllers.getAllClients);
clientRoutes.get('/:id', protect, admin, controllers.getClientById);
clientRoutes.put('/:id', protect, admin, controllers.updateClient);
clientRoutes.delete('/:id', protect, admin, controllers.deleteClient);
clientRoutes.get('/:id/statement', protect, admin, controllers.getClientStatement);

// ==================================================
// 5. COST ROUTES
// ==================================================
const costRoutes = express.Router();
costRoutes.post('/', protect, admin, controllers.createCost);
costRoutes.get('/', protect, admin, controllers.getAllCosts);
costRoutes.get('/dashboard-summary', protect, admin, controllers.getDashboardSummary);

// ==================================================
// 6. MANAGER ROUTES
// ==================================================
const managerRoutes = express.Router();
managerRoutes.post('/', protect, admin, controllers.createManager);
managerRoutes.get('/', protect, admin, controllers.getAllManagers);
managerRoutes.get('/:id', protect, admin, controllers.getManagerById);
managerRoutes.put('/:id', protect, admin, controllers.updateManager);
managerRoutes.delete('/:id', protect, admin, controllers.deleteManager);

// ==================================================
// 7. EXPENSE ROUTES
// ==================================================
const expenseRoutes = express.Router();
expenseRoutes.post('/', protect, adminOrManager, controllers.createExpense);
expenseRoutes.get('/', protect, adminOrManager, controllers.getAllExpenses);
expenseRoutes.get('/summary', protect, adminOrManager, controllers.getExpenseSummary);
expenseRoutes.put('/:id', protect, adminOrManager, controllers.updateExpense);
expenseRoutes.delete('/:id', protect, adminOrManager, controllers.deleteExpense);

// ==================================================
// 8. STATS ROUTES
// ==================================================
const statsRoutes = express.Router();
statsRoutes.get('/overview', protect, admin, controllers.getOverview);
statsRoutes.get('/services', protect, admin, controllers.getServices);
statsRoutes.get('/financials', protect, admin, controllers.getFinancials);

// ==================================================
// 9. ADMIN ROUTES
// ==================================================
const adminRoutes = express.Router();
adminRoutes.delete('/orders/history', protect, admin, controllers.deleteHistory);
adminRoutes.get('/export-financial', protect, admin, controllers.exportFinancial);
adminRoutes.get('/drivers/:driverId/trips', protect, admin, controllers.getDriverTrips);
adminRoutes.get('/trips/:tripId', protect, admin, controllers.getTripById);

module.exports = {
  authRoutes,
  orderRoutes,
  driverRoutes,
  clientRoutes,
  costRoutes,
  managerRoutes,
  expenseRoutes,
  statsRoutes,
  adminRoutes
};
