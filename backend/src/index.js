const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./utils/database');
const shipmentsRouter = require('./routes/shipments');
const validationRouter = require('./routes/validation');
const customersRouter = require('./routes/customers');
const trackingRouter = require('./routes/tracking');
const auditRouter = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'DHL Shipment API is running' });
});

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/validation', validationRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/audit', auditRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await db.initialize();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`DHL Shipment API running on http://localhost:${PORT}`);
      console.log('Available routes:');
      console.log('  GET    /api/health');
      console.log('  GET    /api/customers/:dealId');
      console.log('  POST   /api/validation/address');
      console.log('  POST   /api/shipments');
      console.log('  GET    /api/shipments/:shipmentId');
      console.log('  GET    /api/tracking/:awbNumber');
      console.log('  GET    /api/audit/logs');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
