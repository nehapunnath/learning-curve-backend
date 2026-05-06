// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Routes = require('./Routes/Route');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://the-learning-curve-rouge.vercel.app'
    // process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT','PATCH' ,'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/',Routes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Enquiry API is running',
    endpoints: {
      submit: 'POST /api/enquiries/submit'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
//   console.log(`📧 Enquiry endpoint: http://localhost:${PORT}/api/enquiries/submit`);
});