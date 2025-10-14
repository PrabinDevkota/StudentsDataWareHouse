const authService = require('../services/auth.service');
const logger = require('../utils/logger');

// Verify JWT token and attach user to request
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Check if user is admin
const requireAdmin = requireRole('ADMIN');

// Check if user is faculty or admin
const requireFacultyOrAdmin = requireRole(['FACULTY', 'ADMIN']);

// Check if user is CIR or admin
const requireCIROrAdmin = requireRole(['CIR', 'ADMIN']);

// Check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceIdParam = 'id', profileType = 'STUDENT') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const resourceId = req.params[resourceIdParam];

    // Admin can access everything
    if (userRole === 'ADMIN') {
      return next();
    }

    // Check if user owns the resource
    if (req.user.profile_type === profileType && req.user.profile_ref_id === resourceId) {
      return next();
    }

    // Faculty can access student resources
    if (userRole === 'FACULTY' && profileType === 'STUDENT') {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only access your own resources.',
      code: 'ACCESS_DENIED'
    });
  };
};

// Check if user owns the resource, is admin, or has one of the allowed roles
// Useful for broadening read-only access on specific routes
const requireOwnershipAdminOrRoles = (roles = [], resourceIdParam = 'id', profileType = 'STUDENT') => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const resourceId = req.params[resourceIdParam];

    // Admin can access everything
    if (userRole === 'ADMIN') {
      return next();
    }

    // Check if user owns the resource
    if (req.user.profile_type === profileType && req.user.profile_ref_id === resourceId) {
      return next();
    }

    // Allow specific roles
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only access your own resources.',
      code: 'ACCESS_DENIED'
    });
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = authService.verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireFacultyOrAdmin,
  requireCIROrAdmin,
  requireOwnershipOrAdmin,
  requireOwnershipAdminOrRoles,
  optionalAuth
};
