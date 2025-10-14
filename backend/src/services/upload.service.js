const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const avatarDir = path.join(process.cwd(), config.upload.avatarPath);
  const yearDir = path.join(avatarDir, new Date().getFullYear().toString());
  const monthDir = path.join(yearDir, (new Date().getMonth() + 1).toString().padStart(2, '0'));
  const dayDir = path.join(monthDir, new Date().getDate().toString().padStart(2, '0'));

  [avatarDir, yearDir, monthDir, dayDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  return dayDir;
};

// Generate unique filename
const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalname);
  const name = path.basename(originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${timestamp}-${randomHex}-${name}${ext}`;
};

// Configure multer storage for avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = ensureUploadDirs();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`File type ${file.mimetype} not allowed. Allowed types: ${config.upload.allowedTypes.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Configure multer for avatars
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1 // Only allow single file upload
  }
});

// Single avatar upload middleware
const uploadAvatar = upload.single('avatar');

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  const expectedField = req._expectedUploadField || 'avatar';
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        maxSize: config.upload.maxFileSize,
        maxSizeMB: Math.round(config.upload.maxFileSize / (1024 * 1024))
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        code: 'TOO_MANY_FILES',
        maxFiles: 1
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        code: 'UNEXPECTED_FILE_FIELD',
        expectedField
      });
    }
  } else if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: 'Invalid file type',
      code: 'INVALID_FILE_TYPE',
      allowedTypes: config.upload.allowedTypes
    });
  }

  next(err);
};

// Get relative path from uploads directory
const getRelativePath = (filePath) => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  return path.relative(uploadsDir, filePath);
};

// ===== Excel Import Support =====
// Ensure import directories exist
const ensureImportDirs = () => {
  const importBase = path.join(process.cwd(), 'uploads', 'imports');
  const yearDir = path.join(importBase, new Date().getFullYear().toString());
  const monthDir = path.join(yearDir, (new Date().getMonth() + 1).toString().padStart(2, '0'));
  const dayDir = path.join(monthDir, new Date().getDate().toString().padStart(2, '0'));

  [importBase, yearDir, monthDir, dayDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  return dayDir;
};

// Storage for import files
const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = ensureImportDirs();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  }
});

// Allowed Excel mimetypes
const excelMimeTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv'
];

// File filter for imports
const importFileFilter = (req, file, cb) => {
  if (excelMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`File type ${file.mimetype} not allowed. Allowed types: ${excelMimeTypes.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const uploadImportMulter = multer({
  storage: importStorage,
  fileFilter: importFileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1
  }
});

// Single file upload for imports
const uploadImportFile = (req, res, next) => {
  req._expectedUploadField = 'file';
  return uploadImportMulter.single('file')(req, res, next);
};

// Delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('File deleted successfully:', filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
};

// Delete old avatar when updating
const deleteOldAvatar = async (oldAvatarPath) => {
  if (!oldAvatarPath) return;

  const fullPath = path.join(process.cwd(), 'uploads', oldAvatarPath);
  return deleteFile(fullPath);
};

// Validate file
const validateFile = (file) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  if (!config.upload.allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${config.upload.allowedTypes.join(', ')}`);
  }

  if (file.size > config.upload.maxFileSize) {
    throw new Error(`File too large. Maximum size: ${Math.round(config.upload.maxFileSize / (1024 * 1024))}MB`);
  }

  return true;
};

// Get file info
const getFileInfo = (file) => {
  if (!file) return null;

  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    relativePath: getRelativePath(file.path)
  };
};

module.exports = {
  uploadAvatar,
  uploadImportFile,
  handleUploadError,
  getRelativePath,
  deleteFile,
  deleteOldAvatar,
  validateFile,
  getFileInfo,
  ensureUploadDirs,
  ensureImportDirs
};
