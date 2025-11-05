require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(compression()); // Enable gzip compression
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache headers for static assets
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  } else if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes for pages
  }
  next();
});

// Basic Auth Middleware for Admin
const basicAuth = (req, res, next) => {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
    return next(); // Skip auth if not configured
  }
  
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    return res.status(401).send('Authentication required');
  }
  
  const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  const [username, password] = credentials;
  
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    res.status(401).send('Invalid credentials');
  }
};

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (React build and public assets)
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/programmatic-seo-tool')
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// API Routes (must come BEFORE catch-all routes)
const adminRoutes = require('./routes/admin');
app.use('/api', basicAuth, adminRoutes); // Protect API with basic auth

// Specific routes (must come BEFORE dynamic slug route)
const pagesRoutes = require('./routes/pages');
app.use('/', pagesRoutes);

// Protect admin panel with basic auth
app.use('/admin*', basicAuth);
// Serve React admin build
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Fallback for React admin routes (SPA) - comes AFTER all other routes
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
});

module.exports = app;