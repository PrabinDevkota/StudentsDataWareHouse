const logger = require('../utils/logger');
const config = require('../config/env');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Default error response
  let status = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details = null;

  // Handle specific error types
  const errMsg = (err.message || '').toLowerCase();
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.details || err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
    code = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'Resource not found';
    code = 'NOT_FOUND';
  } else if (err.name === 'ConflictError') {
    status = 409;
    message = 'Resource conflict';
    code = 'CONFLICT';
  } else if (err.code === '23505') { // PostgreSQL unique violation
    status = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_ENTRY';
    details = extractDuplicateField(err.detail);
  } else if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) { // MySQL duplicate entry
    status = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_ENTRY';
    details = extractMysqlDuplicateField(err.message);
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    status = 400;
    message = 'Invalid reference';
    code = 'FOREIGN_KEY_VIOLATION';
    details = extractForeignKeyField(err.detail);
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) { // MySQL FK insert/update
    status = 400;
    message = 'Invalid reference';
    code = 'FOREIGN_KEY_VIOLATION';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) { // MySQL FK delete restricted
    status = 400;
    message = 'Invalid reference';
    code = 'FOREIGN_KEY_VIOLATION';
  } else if (err.code === '23514') { // PostgreSQL check constraint violation
    status = 400;
    message = 'Constraint violation';
    code = 'CONSTRAINT_VIOLATION';
    details = extractConstraintField(err.detail);
  } else if (err.errno === 3819) { // MySQL check constraint violation
    status = 400;
    message = 'Constraint violation';
    code = 'CONSTRAINT_VIOLATION';
  } else if (err.code === '23502') { // PostgreSQL not null violation
    status = 400;
    message = 'Required field missing';
    code = 'NOT_NULL_VIOLATION';
    details = extractNotNullField(err.detail);
  } else if (err.code === 'ER_BAD_NULL_ERROR' || err.errno === 1048) { // MySQL not null violation
    status = 400;
    message = 'Required field missing';
    code = 'NOT_NULL_VIOLATION';
  } else if (err.code === '22P02') { // PostgreSQL invalid text representation (e.g., UUID)
    status = 400;
    message = 'Invalid input format';
    code = 'INVALID_INPUT_FORMAT';
    details = extractInvalidTextRepresentation(err.detail);
  } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE' || err.errno === 1292) { // MySQL invalid date/time
    status = 400;
    message = 'Invalid date/time format';
    code = 'INVALID_DATETIME_FORMAT';
  } else if (err.code === '22007') { // PostgreSQL invalid datetime format
    status = 400;
    message = 'Invalid date/time format';
    code = 'INVALID_DATETIME_FORMAT';
    details = extractInvalidDateTimeField(err.detail);
  } else if (err.message && err.message.includes('duplicate key')) {
    status = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_ENTRY';
  } else if (err.message && err.message.includes('not found')) {
    status = 404;
    message = 'Resource not found';
    code = 'NOT_FOUND';
  } else if (err.message && err.message.includes('permission denied')) {
    status = 403;
    message = 'Permission denied';
    code = 'PERMISSION_DENIED';
  } else if (errMsg.includes('invalid credentials')) {
    status = 401;
    message = 'Invalid credentials';
    code = 'INVALID_CREDENTIALS';
  } else if (errMsg.includes('account is deactivated')) {
    status = 403;
    message = 'Account is deactivated';
    code = 'ACCOUNT_DEACTIVATED';
  } else if (errMsg.includes('token')) {
    status = 401;
    message = 'Invalid or expired token';
    code = 'INVALID_TOKEN';
  } else if (errMsg.includes('validation')) {
    status = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  }

  // Prepare error response
  const errorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // Add details in development mode
  if (config.server.env === 'development') {
    errorResponse.details = details || err.message;
    errorResponse.stack = err.stack;
  } else if (details) {
    errorResponse.details = details;
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  res.status(status).json(errorResponse);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

// Helper functions to extract field information from PostgreSQL errors
function extractDuplicateField(detail) {
  if (!detail) return null;
  const match = detail.match(/Key \(([^)]+)\)/);
  return match ? { field: match[1], message: 'This value already exists' } : null;
}

// Parse MySQL duplicate entry error
function extractMysqlDuplicateField(message) {
  if (!message) return null;
  // Example: ER_DUP_ENTRY: Duplicate entry 'foo' for key 'users.email_unique'
  const keyMatch = message.match(/for key\s+'([^']+)'/i);
  const valueMatch = message.match(/Duplicate entry\s+'([^']+)'/i);
  return {
    key: keyMatch ? keyMatch[1] : undefined,
    value: valueMatch ? valueMatch[1] : undefined,
    message: 'This value already exists'
  };
}

function extractForeignKeyField(detail) {
  if (!detail) return null;
  const match = detail.match(/Key \(([^)]+)\)=\([^)]+\) is not present in table "([^"]+)"/);
  return match ? { 
    field: match[1], 
    table: match[2], 
    message: `Referenced ${match[2]} does not exist` 
  } : null;
}

function extractConstraintField(detail) {
  if (!detail) return null;
  const match = detail.match(/check constraint "([^"]+)"/);
  return match ? { 
    constraint: match[1], 
    message: 'Value violates constraint' 
  } : null;
}

function extractNotNullField(detail) {
  if (!detail) return null;
  const match = detail.match(/null value in column "([^"]+)"/);
  return match ? { 
    field: match[1], 
    message: 'This field is required' 
  } : null;
}

// Parse invalid text representation (e.g., UUID)
function extractInvalidTextRepresentation(detail) {
  if (!detail) return null;
  // Examples:
  // "invalid input syntax for type uuid: \"Computer Science\""
  // "invalid input syntax for type integer: \"abc\""
  const typeMatch = detail.match(/invalid input syntax for type ([^:]+):/i);
  const valueMatch = detail.match(/:\s*"([^"]+)"/);
  return {
    type: typeMatch ? typeMatch[1] : undefined,
    value: valueMatch ? valueMatch[1] : undefined,
    message: 'Provided value has invalid format'
  };
}

// Parse invalid datetime format details
function extractInvalidDateTimeField(detail) {
  if (!detail) return null;
  // Example: "invalid input syntax for type date: \"09/03/2025\""
  const valueMatch = detail.match(/type\s+(date|timestamp).*?:\s*"([^"]+)"/i);
  return valueMatch ? {
    type: valueMatch[1],
    value: valueMatch[2],
    message: 'Use ISO format yyyy-mm-dd for dates'
  } : null;
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
