const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

// Import route modules
const authRoutes = require('./auth.routes');
const studentsRoutes = require('./students.routes');
const companiesRoutes = require('./companies.routes');
const facultyRoutes = require('./faculty.routes');
const placementsRoutes = require('./placements.routes');
const clubsRoutes = require('./clubs.routes');
const researchRoutes = require('./research.routes');
const skillsRoutes = require('./skills.routes');
const interestsRoutes = require('./interests.routes');
const departmentsRoutes = require('./departments.routes');
const invitationsRoutes = require('./invitations.routes');

const router = express.Router();

// Security middleware
router.use(helmet());
router.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting (disabled in development for easier local testing)
if (config.server.env !== 'development') {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  router.use(limiter);
}

// Body parsing middleware
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Student Data Warehouse API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/students', studentsRoutes);
router.use('/companies', companiesRoutes);
router.use('/faculty', facultyRoutes);
router.use('/placements', placementsRoutes);
router.use('/clubs', clubsRoutes);
router.use('/research', researchRoutes);
router.use('/skills', skillsRoutes);
router.use('/interests', interestsRoutes);
router.use('/departments', departmentsRoutes);
router.use('/', invitationsRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = router;
