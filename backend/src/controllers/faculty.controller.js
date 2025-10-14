const facultyModel = require('../models/faculty.model');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');
const uploadService = require('../services/upload.service');
const XLSX = require('xlsx');

// Get all faculty with filters and pagination
const getFaculty = asyncHandler(async (req, res) => {
  const filters = req.query;
  const { page = 1, limit = 10 } = filters;

  try {
    const [faculty, total] = await Promise.all([
      facultyModel.findByFilters(filters),
      facultyModel.countByFilters(filters)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: faculty,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Get faculty failed:', { filters, error: error.message });
    throw error;
  }
});

// Get faculty by ID
const getFacultyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const faculty = await facultyModel.getByIdWithRelations(id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        error: 'Faculty not found',
        code: 'FACULTY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: faculty
    });
  } catch (error) {
    logger.error('Get faculty by ID failed:', { id, error: error.message });
    throw error;
  }
});

// Create new faculty
const createFaculty = asyncHandler(async (req, res) => {
  const facultyData = req.body;

  try {
    // Check if email already exists
    const existingFaculty = await facultyModel.findByEmail(facultyData.email);
    if (existingFaculty) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        code: 'DUPLICATE_EMAIL'
      });
    }

    const faculty = await facultyModel.create(facultyData);
    
    logger.info('Faculty created successfully', { 
      faculty_id: faculty.faculty_id,
      email: faculty.email
    });

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: faculty
    });
  } catch (error) {
    logger.error('Create faculty failed:', { facultyData, error: error.message });
    throw error;
  }
});

// Update faculty
const updateFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // If no fields provided, return existing record to avoid SQL syntax error
    if (!updateData || Object.keys(updateData).length === 0) {
      const existing = await facultyModel.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Faculty not found',
          code: 'FACULTY_NOT_FOUND'
        });
      }
      return res.json({
        success: true,
        message: 'Faculty updated successfully',
        data: existing
      });
    }

    // Handle email duplication explicitly
    if (updateData.email) {
      const existingByEmail = await facultyModel.findByEmail(updateData.email);
      if (existingByEmail && existingByEmail.faculty_id !== id) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          code: 'DUPLICATE_EMAIL'
        });
      }
    }

    const updatedFaculty = await facultyModel.update(id, updateData);
    
    if (!updatedFaculty) {
      return res.status(404).json({
        success: false,
        error: 'Faculty not found',
        code: 'FACULTY_NOT_FOUND'
      });
    }

    logger.info('Faculty updated successfully', { 
      faculty_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Faculty updated successfully',
      data: updatedFaculty
    });
  } catch (error) {
    // Map known database errors to meaningful HTTP responses
    // 23505: unique_violation, 23503: foreign_key_violation
    if (error && error.code === '23505') {
      logger.warn('Duplicate field on faculty update', { id, updateData, error: error.detail });
      return res.status(409).json({
        success: false,
        error: 'Duplicate value violates unique constraint',
        code: 'DUPLICATE_VALUE',
        detail: error.detail || undefined
      });
    }
    if (error && error.code === '23503') {
      logger.warn('Foreign key violation on faculty update', { id, updateData, error: error.detail });
      return res.status(400).json({
        success: false,
        error: 'Invalid reference for related field',
        code: 'FOREIGN_KEY_VIOLATION',
        detail: error.detail || undefined
      });
    }
    logger.error('Update faculty failed:', { id, updateData, error: error.message });
    throw error;
  }
});

// Delete faculty
const deleteFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deletedFaculty = await facultyModel.delete(id);
    
    if (!deletedFaculty) {
      return res.status(404).json({
        success: false,
        error: 'Faculty not found',
        code: 'FACULTY_NOT_FOUND'
      });
    }

    logger.info('Faculty deleted successfully', { 
      faculty_id: id,
      email: deletedFaculty.email
    });

    res.json({
      success: true,
      message: 'Faculty deleted successfully',
      data: { faculty_id: id }
    });
  } catch (error) {
    // 23503: foreign_key_violation (e.g., research_projects reference faculty)
    if (error && error.code === '23503') {
      logger.warn('Foreign key violation on faculty delete', { id, error: error.detail });
      return res.status(409).json({
        success: false,
        error: 'Cannot delete faculty with related records',
        code: 'FOREIGN_KEY_VIOLATION',
        detail: error.detail || 'Delete related research projects or reassign them before deleting the faculty.'
      });
    }
    logger.error('Delete faculty failed:', { id, error: error.message });
    throw error;
  }
});

module.exports = {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  // ===== Bulk Import Faculty from Excel =====
  importFacultyFromExcel: asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded', code: 'NO_FILE' });
    }

    // Parse workbook
    let workbook;
    try {
      workbook = XLSX.readFile(file.path, { cellDates: true });
    } catch (err) {
      logger.error('Failed to read Excel file', { err: err.message });
      return res.status(400).json({ success: false, error: 'Invalid Excel file', code: 'INVALID_EXCEL' });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    // Allowed columns mapped to DB fields
    const allowedCols = new Set([
      'faculty_id','first_name','last_name','email','phone','department_id','designation','specialization','avatar_path'
    ]);
    const requiredCols = ['first_name','last_name','email','department_id'];

    const normalizeKey = (k) => String(k || '')
      .toLowerCase()
      .replace(/\./g, '_')
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .trim();

    const sanitizeRow = (row) => {
      const out = {};
      Object.entries(row).forEach(([k,v]) => {
        const nk = normalizeKey(k);
        if (allowedCols.has(nk)) {
          out[nk] = v;
        }
      });

      // Trim strings where applicable
      ['first_name','last_name','email','phone','designation','specialization','avatar_path'].forEach((key) => {
        if (out[key] !== null && out[key] !== undefined) {
          out[key] = String(out[key]).trim();
        }
      });
      if (out.department_id) {
        out.department_id = String(out.department_id).trim();
      }
      return out;
    };

    const processed = rows.length;
    let inserted = 0;
    let skippedDuplicate = 0;
    let skippedInvalid = 0;
    const errors = [];

    // Chunk insert using INSERT IGNORE to skip duplicates (PK/unique)
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < rows.length; i += chunkSize) {
      chunks.push(rows.slice(i, i + chunkSize));
    }

    await facultyModel.transaction(async (client) => {
      for (const chunk of chunks) {
        const sanitized = chunk.map(sanitizeRow);
        const valid = sanitized.filter(r => requiredCols.every(c => r[c] !== null && r[c] !== undefined && r[c] !== ''));
        const invalidCount = sanitized.length - valid.length;
        skippedInvalid += invalidCount;

        if (valid.length === 0) continue;

        // Build dynamic insert
        const cols = Array.from(allowedCols).filter(c => valid.some(r => r[c] !== undefined));
        if (cols.length === 0) continue;

        const valuesPlaceholders = valid.map(() => `(${cols.map(() => '?').join(', ')})`).join(', ');
        const params = [];
        valid.forEach(row => {
          cols.forEach(col => params.push(row[col] !== undefined ? row[col] : null));
        });

        const sql = `INSERT IGNORE INTO faculty (${cols.join(', ')}) VALUES ${valuesPlaceholders}`;
        try {
          const result = await client.query(sql, params);
          const affected = result.meta && typeof result.meta.affectedRows === 'number' ? result.meta.affectedRows : 0;
          inserted += affected;
          skippedDuplicate += Math.max(valid.length - affected, 0);
        } catch (err) {
          logger.error('Bulk insert chunk failed (faculty)', { err: err.message });
          errors.push(err.message);
        }
      }
    });

    logger.info('Faculty import summary', { processed, inserted, skippedDuplicate, skippedInvalid });
    return res.status(200).json({
      success: true,
      message: 'Import completed',
      data: { processed, inserted, skipped_duplicate: skippedDuplicate, skipped_invalid: skippedInvalid, errors }
    });
  })
};
