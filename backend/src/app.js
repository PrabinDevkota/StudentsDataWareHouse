const express = require('express');
const path = require('path');
const config = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Import routes
const apiRoutes = require('./routes');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

// Serve static files (avatars)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Documentation endpoint (must be before /api routes)
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Student Data Warehouse API Documentation',
    version: '1.0.0',
    endpoints: {
      health: {
        method: 'GET',
        path: '/api/health',
        description: 'Health check endpoint',
        auth: 'None'
      },
      students: {
        'GET /': {
          method: 'GET',
          path: '/api/students',
          description: 'Get all students with filtering and pagination',
          auth: 'Optional'
        },
        'GET /:id': {
          method: 'GET',
          path: '/api/students/:id',
          description: 'Get student by ID',
          auth: 'Required (Ownership or Admin)'
        },
        'POST /': {
          method: 'POST',
          path: '/api/students',
          description: 'Create new student',
          auth: 'Admin only'
        },
        'PUT /:id': {
          method: 'PUT',
          path: '/api/students/:id',
          description: 'Update student',
          auth: 'Required (Ownership or Admin)'
        },
        'DELETE /:id': {
          method: 'DELETE',
          path: '/api/students/:id',
          description: 'Delete student',
          auth: 'Admin only'
        },
        'GET /:id/skills': {
          method: 'GET',
          path: '/api/students/:id/skills',
          description: 'Get student skills',
          auth: 'Required (Ownership or Admin)'
        },
        'POST /:id/skills': {
          method: 'POST',
          path: '/api/students/:id/skills',
          description: 'Add skill to student',
          auth: 'Required (Ownership or Admin)'
        },
        'DELETE /:id/skills/:skill_id': {
          method: 'DELETE',
          path: '/api/students/:id/skills/:skill_id',
          description: 'Remove skill from student',
          auth: 'Required (Ownership or Admin)'
        },
        'GET /:id/interests': {
          method: 'GET',
          path: '/api/students/:id/interests',
          description: 'Get student interests',
          auth: 'Required (Ownership or Admin)'
        },
        'POST /:id/avatar': {
          method: 'POST',
          path: '/api/students/:id/avatar',
          description: 'Upload student avatar',
          auth: 'Required (Ownership or Admin)'
        }
      },
      companies: {
        'GET /': {
          method: 'GET',
          path: '/api/companies',
          description: 'Get all companies',
          auth: 'None'
        },
        'GET /:id': {
          method: 'GET',
          path: '/api/companies/:id',
          description: 'Get company by ID',
          auth: 'None'
        },
        'POST /': {
          method: 'POST',
          path: '/api/companies',
          description: 'Create new company',
          auth: 'CIR/Admin only'
        },
        'PUT /:id': {
          method: 'PUT',
          path: '/api/companies/:id',
          description: 'Update company',
          auth: 'CIR/Admin only'
        },
        'DELETE /:id': {
          method: 'DELETE',
          path: '/api/companies/:id',
          description: 'Delete company',
          auth: 'CIR/Admin only'
        },
        'GET /:id/candidates': {
          method: 'GET',
          path: '/api/companies/:id/candidates',
          description: 'Get company candidates',
          auth: 'CIR/Admin only'
        },
        'POST /:id/job-roles': {
          method: 'POST',
          path: '/api/companies/:id/job-roles',
          description: 'Create job role for company',
          auth: 'CIR/Admin only'
        },
        'PUT /:id/job-roles/:job_role_id': {
          method: 'PUT',
          path: '/api/companies/:id/job-roles/:job_role_id',
          description: 'Update job role',
          auth: 'CIR/Admin only'
        },
        'DELETE /:id/job-roles/:job_role_id': {
          method: 'DELETE',
          path: '/api/companies/:id/job-roles/:job_role_id',
          description: 'Delete job role',
          auth: 'CIR/Admin only'
        }
      },
      faculty: {
        'GET /': {
          method: 'GET',
          path: '/api/faculty',
          description: 'Get all faculty',
          auth: 'None'
        },
        'GET /:id': {
          method: 'GET',
          path: '/api/faculty/:id',
          description: 'Get faculty by ID',
          auth: 'Required'
        },
        'POST /': {
          method: 'POST',
          path: '/api/faculty',
          description: 'Create new faculty',
          auth: 'Admin only'
        },
        'PUT /:id': {
          method: 'PUT',
          path: '/api/faculty/:id',
          description: 'Update faculty',
          auth: 'Required (Ownership or Admin)'
        },
        'DELETE /:id': {
          method: 'DELETE',
          path: '/api/faculty/:id',
          description: 'Delete faculty',
          auth: 'Admin only'
        }
      },
      placements: {
        'GET /': {
          method: 'GET',
          path: '/api/placements',
          description: 'Get all placements',
          auth: 'CIR/Admin only'
        },
        'GET /:id': {
          method: 'GET',
          path: '/api/placements/:id',
          description: 'Get placement by ID',
          auth: 'CIR/Admin only'
        },
        'POST /': {
          method: 'POST',
          path: '/api/placements',
          description: 'Create new placement',
          auth: 'CIR/Admin only'
        },
        'PUT /:id/status': {
          method: 'PUT',
          path: '/api/placements/:id/status',
          description: 'Update placement status',
          auth: 'CIR/Admin only'
        },
        'GET /stats/summary': {
          method: 'GET',
          path: '/api/placements/stats/summary',
          description: 'Get placement statistics',
          auth: 'CIR/Admin only'
        }
      },
      clubs: {
        'GET /': {
          method: 'GET',
          path: '/api/clubs',
          description: 'Get all clubs',
          auth: 'None'
        },
        'GET /:id': {
          method: 'GET',
          path: '/api/clubs/:id',
          description: 'Get club by ID',
          auth: 'None'
        },
        'POST /': {
          method: 'POST',
          path: '/api/clubs',
          description: 'Create new club',
          auth: 'Admin only'
        },
        'PUT /:id': {
          method: 'PUT',
          path: '/api/clubs/:id',
          description: 'Update club',
          auth: 'Admin only'
        },
        'DELETE /:id': {
          method: 'DELETE',
          path: '/api/clubs/:id',
          description: 'Delete club',
          auth: 'Admin only'
        },
        'GET /:id/candidates': {
          method: 'GET',
          path: '/api/clubs/:id/candidates',
          description: 'Get club candidates',
          auth: 'Required'
        },
        'POST /:id/members': {
          method: 'POST',
          path: '/api/clubs/:id/members',
          description: 'Add member to club',
          auth: 'Required'
        },
        'DELETE /:id/members/:student_id': {
          method: 'DELETE',
          path: '/api/clubs/:id/members/:student_id',
          description: 'Remove member from club',
          auth: 'Required'
        }
      },
      research: {
        'GET /projects': {
          method: 'GET',
          path: '/api/research/projects',
          description: 'Get all research projects',
          auth: 'None'
        },
        'GET /projects/:id': {
          method: 'GET',
          path: '/api/research/projects/:id',
          description: 'Get research project by ID',
          auth: 'None'
        },
        'POST /projects': {
          method: 'POST',
          path: '/api/research/projects',
          description: 'Create new research project',
          auth: 'Faculty/Admin only'
        },
        'PUT /projects/:id': {
          method: 'PUT',
          path: '/api/research/projects/:id',
          description: 'Update research project',
          auth: 'Faculty/Admin only'
        },
        'DELETE /projects/:id': {
          method: 'DELETE',
          path: '/api/research/projects/:id',
          description: 'Delete research project',
          auth: 'Admin only'
        },
        'POST /projects/:id/participants': {
          method: 'POST',
          path: '/api/research/projects/:id/participants',
          description: 'Add participant to research project',
          auth: 'Faculty/Admin only'
        },
        'DELETE /projects/:id/participants/:student_id': {
          method: 'DELETE',
          path: '/api/research/projects/:id/participants/:student_id',
          description: 'Remove participant from research project',
          auth: 'Faculty/Admin only'
        }
      },
      skills: {
        'GET /': {
          method: 'GET',
          path: '/api/skills',
          description: 'Get all skills',
          auth: 'None'
        },
        'GET /search': {
          method: 'GET',
          path: '/api/skills/search',
          description: 'Search skills',
          auth: 'None'
        },
        'POST /': {
          method: 'POST',
          path: '/api/skills',
          description: 'Create new skill',
          auth: 'Admin only'
        },
        'PUT /:id': {
          method: 'PUT',
          path: '/api/skills/:id',
          description: 'Update skill',
          auth: 'Admin only'
        },
        'DELETE /:id': {
          method: 'DELETE',
          path: '/api/skills/:id',
          description: 'Delete skill',
          auth: 'Admin only'
        }
      },
      interests: {
        'GET /': {
          method: 'GET',
          path: '/api/interests',
          description: 'Get all interests',
          auth: 'None'
        },
        'GET /search': {
          method: 'GET',
          path: '/api/interests/search',
          description: 'Search interests',
          auth: 'None'
        },
        'POST /': {
          method: 'POST',
          path: '/api/interests',
          description: 'Create new interest',
          auth: 'Admin only'
        },
        'PUT /:id': {
          method: 'PUT',
          path: '/api/interests/:id',
          description: 'Update interest',
          auth: 'Admin only'
        },
        'DELETE /:id': {
          method: 'DELETE',
          path: '/api/interests/:id',
          description: 'Delete interest',
          auth: 'Admin only'
        }
      }
    },
    authentication: {
      'POST /login': {
        method: 'POST',
        path: '/api/auth/login',
        description: 'User login',
        auth: 'None'
      },
      'GET /me': {
        method: 'GET',
        path: '/api/auth/me',
        description: 'Get current user profile',
        auth: 'Required'
      },
      'POST /logout': {
        method: 'POST',
        path: '/api/auth/logout',
        description: 'User logout',
        auth: 'Required'
      },
      'POST /refresh': {
        method: 'POST',
        path: '/api/auth/refresh',
        description: 'Refresh access token',
        auth: 'Required'
      },
      'PUT /change-password': {
        method: 'PUT',
        path: '/api/auth/change-password',
        description: 'Change user password',
        auth: 'Required'
      },
      'POST /register': {
        method: 'POST',
        path: '/api/auth/register',
        description: 'User registration',
        auth: 'Admin only'
      }
    },
    documentation: {
      schema: '/docs/schema.md',
      endpoints: '/docs/endpoints.md',
      readme: '/README.md'
    }
  });
});

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student Data Warehouse API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health'
  });
});


// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
