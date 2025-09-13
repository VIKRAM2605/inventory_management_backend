import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './routes/products.js';
import billRoutes from './routes/bills.js';
import inventoryRoutes from './routes/inventory.js';
import shopRoutes from './routes/shopRoutes.js'
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://inventory-management-frontend-ocod.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Electrical Shop API Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/shopDetails',shopRoutes);
// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Electrical Shop API',
    version: '1.0.0',
    port: PORT,
    endpoints: {
      products: '/api/products',
      bills: '/api/bills',
      inventory: '/api/inventory',
      health: '/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/products',
      '/api/bills',
      '/api/inventory',
      '/health'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Electrical Shop API Server`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌐 Server running on port: ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`📁 Static Files: http://localhost:${PORT}/uploads`);
  console.log('=================================');
});

export default app;
