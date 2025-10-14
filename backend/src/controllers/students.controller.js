const studentsModel = require('../models/students.model');
const usersModel = require('../models/users.model');
const skillsModel = require('../models/skills.model');
const interestsModel = require('../models/interests.model');
const uploadService = require('../services/upload.service');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');
const XLSX = require('xlsx');

// Get all students with filters
const getStudents = asyncHandler(async (req, res) => {
  const filters = req.query;
  const { page = 1, limit = 20 } = filters;

  try {
    const [students, total] = await Promise.all([
      studentsModel.findByFilters(filters),
      studentsModel.countByFilters(filters)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        students,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get students failed:', { filters, error: error.message });
    throw error;
  }
});

// Get student by ID
const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const student = await studentsModel.getByIdWithRelations(id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    logger.error('Get student by ID failed:', { id, error: error.message });
    throw error;
  }
});

// Create new student
const createStudent = asyncHandler(async (req, res) => {
  const studentData = req.body;

  try {
    // Check if student_id already exists (admin-provided ID)
    const existingById = await studentsModel.query(
      'SELECT student_id FROM students WHERE student_id = ?',
      [studentData.student_id]
    );
    
    if (existingById.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Student ID already exists',
        code: 'DUPLICATE_STUDENT_ID'
      });
    }

    // Check if email already exists
    const existingByEmail = await studentsModel.query(
      'SELECT student_id FROM students WHERE email = ?',
      [studentData.email]
    );
    
    if (existingByEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        code: 'DUPLICATE_EMAIL'
      });
    }

    const student = await studentsModel.create(studentData);

    // Ensure a corresponding users record exists so the student can log in
    try {
      const existingUser = await usersModel.findByEmail(student.email);
      if (existingUser) {
        // Tie user to this student and set a simple password policy as requested (password = first_name)
        await usersModel.update(existingUser.user_id, {
          role: 'STUDENT',
          profile_type: 'STUDENT',
          profile_ref_id: student.student_id,
          is_active: true,
        });
        await usersModel.updatePassword(existingUser.user_id, student.first_name);
      } else {
        await usersModel.createUser({
          email: student.email,
          password: student.first_name, // per requirement: student's name as password
          role: 'STUDENT',
          profile_type: 'STUDENT',
          profile_ref_id: student.student_id,
        });
      }
    } catch (userErr) {
      // Do not fail the whole request if user creation fails; log for follow-up
      logger.error('Failed to upsert users record for student', {
        student_id: student.student_id,
        email: student.email,
        error: userErr.message,
      });
    }
    
    logger.info('Student created successfully', { 
      student_id: student.student_id,
      email: student.email
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    logger.error('Create student failed:', { studentData, error: error.message });
    throw error;
  }
});

// Update student
const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Check if student exists
    const existingStudent = await studentsModel.findById(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    // Handle skills update
    if (updateData.skills !== undefined) {
      await studentsModel.updateSkills(id, updateData.skills, updateData.skill_proficiency_levels);
      delete updateData.skills;
      delete updateData.skill_proficiency_levels;
    }

    // Handle interests update
    if (updateData.interests !== undefined) {
      await studentsModel.updateInterests(id, updateData.interests);
      delete updateData.interests;
    }

    // Update other fields
    if (Object.keys(updateData).length > 0) {
      const updatedStudent = await studentsModel.update(id, updateData);
      
      logger.info('Student updated successfully', { 
        student_id: id,
        updated_fields: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Student updated successfully',
        data: updatedStudent
      });
    } else {
      res.json({
        success: true,
        message: 'Student updated successfully',
        data: existingStudent
      });
    }
  } catch (error) {
    logger.error('Update student failed:', { id, updateData, error: error.message });
    throw error;
  }
});

// Delete student
const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deletedStudent = await studentsModel.delete(id);
    
    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    logger.info('Student deleted successfully', { 
      student_id: id
    });

    res.json({
      success: true,
      message: 'Student deleted successfully',
      data: { student_id: id }
    });
  } catch (error) {
    logger.error('Delete student failed:', { id, error: error.message });
    throw error;
  }
});

// Upload avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Check if student exists
    const student = await studentsModel.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    // Validate file
    uploadService.validateFile(req.file);

    // Get file info
    const fileInfo = uploadService.getFileInfo(req.file);
    const relativePath = uploadService.getRelativePath(fileInfo.path);

    // Delete old avatar if exists
    if (student.avatar_path) {
      await uploadService.deleteOldAvatar(student.avatar_path);
    }

    // Update student with new avatar path
    const updatedStudent = await studentsModel.update(id, { 
      avatar_path: relativePath 
    });

    logger.info('Avatar uploaded successfully', { 
      student_id: id,
      avatar_path: relativePath
    });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        student_id: id,
        avatar_path: relativePath,
        file_info: {
          original_name: fileInfo.originalName,
          filename: fileInfo.filename,
          size: fileInfo.size,
          mimetype: fileInfo.mimetype
        }
      }
    });
  } catch (error) {
    logger.error('Upload avatar failed:', { id, error: error.message });
    throw error;
  }
});

// Get student skills
const getStudentSkills = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        s.skill_id,
        s.name,
        s.category,
        ss.proficiency_level,
        ss.acquired_date,
        ss.student_description
      FROM student_skills ss
      JOIN skills s ON ss.skill_id = s.skill_id
      WHERE ss.student_id = ?
      ORDER BY s.name
    `;

    const result = await studentsModel.query(query, [id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Get student skills failed:', { id, error: error.message });
    throw error;
  }
});

// Get student interests
const getStudentInterests = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        i.interest_id,
        i.name,
        i.category,
        si.student_description
      FROM student_interests si
      JOIN interests i ON si.interest_id = i.interest_id
      WHERE si.student_id = ?
      ORDER BY i.name
    `;

    const result = await studentsModel.query(query, [id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Get student interests failed:', { id, error: error.message });
    throw error;
  }
});

// Add skill to student (existing skill)
const addSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { skill_id, proficiency_level = 'INTERMEDIATE', student_description = null } = req.body;

  try {
    // Check if skill exists
    const skill = await skillsModel.findById(skill_id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found',
        code: 'SKILL_NOT_FOUND'
      });
    }

    // Add skill to student (MySQL upsert)
    const upsertSql = `
      INSERT INTO student_skills (student_id, skill_id, proficiency_level, student_description)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        proficiency_level = VALUES(proficiency_level),
        student_description = IFNULL(VALUES(student_description), student_description)
    `;

    await studentsModel.query(upsertSql, [id, skill_id, proficiency_level, student_description]);

    // Fetch the upserted row
    const selectSql = `
      SELECT student_id, skill_id, proficiency_level, student_description
      FROM student_skills
      WHERE student_id = ? AND skill_id = ?
    `;
    const result = await studentsModel.query(selectSql, [id, skill_id]);
    
    logger.info('Skill added to student', { 
      student_id: id,
      skill_id,
      proficiency_level,
      student_description: student_description || undefined
    });

    res.json({
      success: true,
      message: 'Skill added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Add skill failed:', { id, skill_id, error: error.message });
    throw error;
  }
});

// Add new skill to student (create skill if it doesn't exist)
const addNewSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category = 'General', proficiency_level = 'INTERMEDIATE', student_description = null } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Skill name is required',
      code: 'MISSING_SKILL_NAME'
    });
  }

  try {
    // Check if skill already exists
    let skill = await skillsModel.findByName(name.trim());
    
    // If skill doesn't exist, create it
    if (!skill) {
      const skillData = {
        name: name.trim(),
        category: category.trim()
      };
      skill = await skillsModel.create(skillData);
      logger.info('New skill created', { skill_id: skill.skill_id, name: skill.name });
    }

    // Add skill to student (MySQL upsert)
    const upsertSql = `
      INSERT INTO student_skills (student_id, skill_id, proficiency_level, student_description)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        proficiency_level = VALUES(proficiency_level),
        student_description = IFNULL(VALUES(student_description), student_description)
    `;

    await studentsModel.query(upsertSql, [id, skill.skill_id, proficiency_level, student_description]);

    // Fetch the upserted row
    const selectSql = `
      SELECT student_id, skill_id, proficiency_level, student_description
      FROM student_skills
      WHERE student_id = ? AND skill_id = ?
    `;
    const result = await studentsModel.query(selectSql, [id, skill.skill_id]);
    
    logger.info('Skill added to student', { 
      student_id: id,
      skill_id: skill.skill_id,
      skill_name: skill.name,
      proficiency_level,
      was_new_skill: !skill.existed_before,
      student_description: student_description || undefined
    });

    res.json({
      success: true,
      message: skill.existed_before ? 'Existing skill added successfully' : 'New skill created and added successfully',
      data: {
        ...result.rows[0],
        skill: skill
      }
    });
  } catch (error) {
    logger.error('Add new skill failed:', { id, name, error: error.message });
    throw error;
  }
});

// Remove skill from student
const removeSkill = asyncHandler(async (req, res) => {
  const { id, skill_id } = req.params;

  try {
    const query = `
      DELETE FROM student_skills 
      WHERE student_id = ? AND skill_id = ?
    `;

    const result = await studentsModel.query(query, [id, skill_id]);

    const affected = result.meta && typeof result.meta.affectedRows === 'number' ? result.meta.affectedRows : 0;
    if (affected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found for this student',
        code: 'SKILL_NOT_FOUND'
      });
    }

    logger.info('Skill removed from student', { 
      student_id: id,
      skill_id
    });

    res.json({
      success: true,
      message: 'Skill removed successfully'
    });
  } catch (error) {
    logger.error('Remove skill failed:', { id, skill_id, error: error.message });
    throw error;
  }
});

// Add interest to student (existing interest)
const addInterest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { interest_id, student_description = null } = req.body;

  try {
    // Check if interest exists
    const interestsModel = require('../models/interests.model');
    const interest = await interestsModel.findById(interest_id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        error: 'Interest not found',
        code: 'INTEREST_NOT_FOUND'
      });
    }

    // Add interest to student (MySQL upsert)
    const upsertSql = `
      INSERT INTO student_interests (student_id, interest_id, student_description)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        student_description = IFNULL(VALUES(student_description), student_description)
    `;

    await studentsModel.query(upsertSql, [id, interest_id, student_description]);

    const selectSql = `
      SELECT student_id, interest_id, student_description
      FROM student_interests
      WHERE student_id = ? AND interest_id = ?
    `;
    const result = await studentsModel.query(selectSql, [id, interest_id]);
    
    logger.info('Interest added to student', { 
      student_id: id,
      interest_id,
      student_description: student_description || undefined
    });

    res.json({
      success: true,
      message: 'Interest added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Add interest failed:', { id, interest_id, error: error.message });
    throw error;
  }
});

// Add new interest to student (create interest if it doesn't exist)
const addNewInterest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category = 'General', student_description = null } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Interest name is required',
      code: 'MISSING_INTEREST_NAME'
    });
  }

  try {
    // Check if interest already exists
    const interestsModel = require('../models/interests.model');
    let interest = await interestsModel.findByName(name.trim());
    
    // If interest doesn't exist, create it
    if (!interest) {
      const interestData = {
        name: name.trim(),
        category: category.trim()
      };
      interest = await interestsModel.create(interestData);
      logger.info('New interest created', { interest_id: interest.interest_id, name: interest.name });
    }

    // Add interest to student (MySQL upsert)
    const upsertSql = `
      INSERT INTO student_interests (student_id, interest_id, student_description)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        student_description = IFNULL(VALUES(student_description), student_description)
    `;

    await studentsModel.query(upsertSql, [id, interest.interest_id, student_description]);

    const selectSql = `
      SELECT student_id, interest_id, student_description
      FROM student_interests
      WHERE student_id = ? AND interest_id = ?
    `;
    const result = await studentsModel.query(selectSql, [id, interest.interest_id]);
    
    logger.info('Interest added to student', { 
      student_id: id,
      interest_id: interest.interest_id,
      interest_name: interest.name,
      was_new_interest: !interest.existed_before,
      student_description: student_description || undefined
    });

    res.json({
      success: true,
      message: interest.existed_before ? 'Existing interest added successfully' : 'New interest created and added successfully',
      data: {
        ...result.rows[0],
        interest: interest
      }
    });
  } catch (error) {
    logger.error('Add new interest failed:', { id, name, error: error.message });
    throw error;
  }
});

// Remove interest from student
const removeInterest = asyncHandler(async (req, res) => {
  const { id, interest_id } = req.params;

  try {
    const query = `
      DELETE FROM student_interests 
      WHERE student_id = ? AND interest_id = ?
    `;

    const result = await studentsModel.query(query, [id, interest_id]);

    const affected = result.meta && typeof result.meta.affectedRows === 'number' ? result.meta.affectedRows : 0;
    if (affected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interest not found for this student',
        code: 'INTEREST_NOT_FOUND'
      });
    }

    logger.info('Interest removed from student', { 
      student_id: id,
      interest_id
    });

    res.json({
      success: true,
      message: 'Interest removed successfully'
    });
  } catch (error) {
    logger.error('Remove interest failed:', { id, interest_id, error: error.message });
    throw error;
  }
});

// ===== Bulk Import Students from Excel =====
const importStudentsFromExcel = asyncHandler(async (req, res) => {
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
    'student_id','first_name','last_name','email','phone','dob','gender','department_id','semester','cgpa','attendance_percentage','research_experience','avatar_path'
  ]);
  const requiredCols = ['student_id','first_name','last_name','email','department_id','semester'];

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

    // Coerce types
    if (out.dob instanceof Date) {
      const yyyy = out.dob.getFullYear();
      const mm = String(out.dob.getMonth()+1).padStart(2,'0');
      const dd = String(out.dob.getDate()).padStart(2,'0');
      out.dob = `${yyyy}-${mm}-${dd}`;
    }
    if (out.semester !== null && out.semester !== undefined) {
      out.semester = Number(out.semester);
    }
    if (out.cgpa !== null && out.cgpa !== undefined) {
      out.cgpa = Number(out.cgpa);
    }
    if (out.attendance_percentage !== null && out.attendance_percentage !== undefined) {
      out.attendance_percentage = Number(out.attendance_percentage);
    }
    if (out.research_experience !== null && out.research_experience !== undefined) {
      const s = String(out.research_experience).toLowerCase();
      out.research_experience = ['true','yes','1'].includes(s);
    }
    if (out.gender) {
      const g = String(out.gender).trim();
      out.gender = ['Male','Female','Other'].includes(g) ? g : null;
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

  await studentsModel.transaction(async (client) => {
    for (const chunk of chunks) {
      const sanitized = chunk.map(sanitizeRow);
      // Basic required field validation
      const basicValid = sanitized.filter(r => requiredCols.every(c => r[c] !== null && r[c] !== undefined && r[c] !== ''));
      const basicInvalidCount = sanitized.length - basicValid.length;
      skippedInvalid += basicInvalidCount;

      if (basicValid.length === 0) continue;

      // Validate foreign keys: department_id must exist
      const deptIds = Array.from(new Set(basicValid.map(r => r.department_id).filter(Boolean)));
      let existingDeptIds = new Set();
      if (deptIds.length > 0) {
        const placeholders = deptIds.map(() => '?').join(', ');
        const depRes = await client.query(`SELECT department_id FROM departments WHERE department_id IN (${placeholders})`, deptIds);
        existingDeptIds = new Set(depRes.rows.map(r => String(r.department_id)));
      }
      const fkValid = basicValid.filter(r => existingDeptIds.has(String(r.department_id)));
      const fkInvalidCount = basicValid.length - fkValid.length;
      skippedInvalid += fkInvalidCount;

      if (fkValid.length === 0) continue;

      // Detect duplicates in DB by student_id
      const ids = Array.from(new Set(fkValid.map(r => r.student_id).filter(Boolean)));
      let existingIds = new Set();
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(', ');
        const exRes = await client.query(`SELECT student_id FROM students WHERE student_id IN (${placeholders})`, ids);
        existingIds = new Set(exRes.rows.map(r => String(r.student_id)));
      }

      // Also filter duplicates within the current chunk
      const seenIds = new Set();
      const toInsertRows = [];
      let chunkDuplicates = 0;
      for (const row of fkValid) {
        const sid = String(row.student_id);
        if (existingIds.has(sid)) {
          chunkDuplicates += 1;
          continue;
        }
        if (seenIds.has(sid)) {
          chunkDuplicates += 1;
          continue;
        }
        seenIds.add(sid);
        toInsertRows.push(row);
      }
      skippedDuplicate += chunkDuplicates;

      if (toInsertRows.length === 0) continue;

      // Build dynamic insert
      const cols = Array.from(allowedCols).filter(c => toInsertRows.some(r => r[c] !== undefined));
      if (cols.length === 0) continue;

      const valuesPlaceholders = toInsertRows.map(() => `(${cols.map(() => '?').join(', ')})`).join(', ');
      const params = [];
      toInsertRows.forEach(row => {
        cols.forEach(col => params.push(row[col] !== undefined ? row[col] : null));
      });

      const sql = `INSERT INTO students (${cols.join(', ')}) VALUES ${valuesPlaceholders}`;
      try {
        const result = await client.query(sql, params);
        const affected = result.meta && typeof result.meta.affectedRows === 'number' ? result.meta.affectedRows : toInsertRows.length;
        inserted += affected;
      } catch (err) {
        // Fallback to per-row insertion for accurate invalid counting
        logger.warn('Bulk insert chunk failed, falling back to row-by-row', { err: err.message });
        for (const row of toInsertRows) {
          const singleCols = cols;
          const singleParams = singleCols.map(c => (row[c] !== undefined ? row[c] : null));
          const singleSql = `INSERT INTO students (${singleCols.join(', ')}) VALUES (${singleCols.map(() => '?').join(', ')})`;
          try {
            const r = await client.query(singleSql, singleParams);
            const aff = r.meta && typeof r.meta.affectedRows === 'number' ? r.meta.affectedRows : 1;
            inserted += aff;
          } catch (e) {
            // Treat any failed insert as invalid (non-PK duplicates like email, FK issues, etc.)
            skippedInvalid += 1;
            errors.push(e.message);
          }
        }
      }
    }
  });

  logger.info('Import summary', { processed, inserted, skippedDuplicate, skippedInvalid });
  return res.status(200).json({
    success: true,
    message: 'Import completed',
    data: { processed, inserted, skipped_duplicate: skippedDuplicate, skipped_invalid: skippedInvalid, errors }
  });
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadAvatar,
  getStudentSkills,
  getStudentInterests,
  addSkill,
  addNewSkill,
  removeSkill,
  addInterest,
  addNewInterest,
  removeInterest,
  importStudentsFromExcel,
  // Achievements management
  getStudentAchievements: asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const query = `
        SELECT 
          achievement_id,
          title,
          description,
          achievement_date,
          category,
          is_verified
        FROM achievements
        WHERE student_id = ?
        ORDER BY (achievement_date IS NULL), achievement_date DESC, created_at DESC
      `;

      const result = await studentsModel.query(query, [id]);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      logger.error('Get student achievements failed:', { id, error: error.message });
      throw error;
    }
  }),
  addAchievement: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description = null, achievement_date = null, category = null } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, error: 'Achievement title is required', code: 'MISSING_ACHIEVEMENT_TITLE' });
    }

    try {
      // Pre-generate UUID for MySQL (since INSERT ... RETURNING is not supported)
      const uuidRes = await studentsModel.query('SELECT UUID() AS id');
      const newId = uuidRes.rows[0]?.id;

      const insertQuery = `
        INSERT INTO achievements (achievement_id, student_id, title, description, achievement_date, category, is_verified)
        VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_DATE), ?, FALSE)
      `;

      await studentsModel.query(insertQuery, [newId, id, title.trim(), description, achievement_date, category]);

      const selectQuery = `
        SELECT achievement_id, title, description, achievement_date, category, is_verified
        FROM achievements
        WHERE achievement_id = ?
      `;
      const selectRes = await studentsModel.query(selectQuery, [newId]);

      logger.info('Achievement added for student', {
        student_id: id,
        achievement_id: newId,
        title: title.trim(),
        category: category || undefined,
      });

      res.status(201).json({ success: true, data: selectRes.rows[0] });
    } catch (error) {
      logger.error('Add achievement failed:', { id, error: error.message });
      throw error;
    }
  }),
  removeAchievement: asyncHandler(async (req, res) => {
    const { id, achievement_id } = req.params;

    try {
      const deleteQuery = `
        DELETE FROM achievements
        WHERE student_id = ? AND achievement_id = ?
      `;

      const result = await studentsModel.query(deleteQuery, [id, achievement_id]);
      const affected = result.meta?.affectedRows ?? 0;
      if (affected === 0) {
        return res.status(404).json({ success: false, error: 'Achievement not found for this student', code: 'ACHIEVEMENT_NOT_FOUND' });
      }

      logger.info('Achievement removed from student', { student_id: id, achievement_id });
      res.json({ success: true, message: 'Achievement removed successfully' });
    } catch (error) {
      logger.error('Remove achievement failed:', { id, achievement_id, error: error.message });
      throw error;
    }
  }),
  // Certifications management
  getStudentCertifications: asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const query = `
        SELECT 
          certification_id,
          name,
          issuing_organization,
          issue_date,
          expiry_date,
          credential_id,
          credential_url,
          is_verified
        FROM certifications
        WHERE student_id = ?
        ORDER BY (issue_date IS NULL), issue_date DESC, name
      `;

      const result = await studentsModel.query(query, [id]);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      logger.error('Get student certifications failed:', { id, error: error.message });
      throw error;
    }
  }),
  addCertification: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      name,
      issuing_organization,
      issue_date = null,
      expiry_date = null,
      credential_id = null,
      credential_url = null
    } = req.body;

    try {
      if (!name || !issuing_organization) {
        return res.status(400).json({
          success: false,
          error: 'Name and issuing_organization are required',
          code: 'VALIDATION_ERROR'
        });
      }

      // Pre-generate UUID for MySQL insert
      const uuidRes = await studentsModel.query('SELECT UUID() AS id');
      const newId = uuidRes.rows[0]?.id;

      const insertQuery = `
        INSERT INTO certifications (
          certification_id, student_id, name, issuing_organization, issue_date, expiry_date, credential_id, credential_url, is_verified
        ) VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_DATE), ?, ?, ?, FALSE)
      `;

      await studentsModel.query(insertQuery, [
        newId,
        id,
        name,
        issuing_organization,
        issue_date,
        expiry_date,
        credential_id,
        credential_url
      ]);

      const selectQuery = `
        SELECT certification_id, name, issuing_organization, issue_date, expiry_date, credential_id, credential_url, is_verified
        FROM certifications
        WHERE certification_id = ?
      `;
      const selectRes = await studentsModel.query(selectQuery, [newId]);

      logger.info('Certification added for student', {
        student_id: id,
        certification_id: newId
      });

      res.status(201).json({ success: true, data: selectRes.rows[0] });
    } catch (error) {
      logger.error('Add certification failed:', { id, error: error.message });
      throw error;
    }
  }),
  removeCertification: asyncHandler(async (req, res) => {
    const { id, certification_id } = req.params;

    try {
      const deleteQuery = `
        DELETE FROM certifications 
        WHERE student_id = ? AND certification_id = ?
      `;

      const result = await studentsModel.query(deleteQuery, [id, certification_id]);
      const affected = result.meta?.affectedRows ?? 0;
      if (affected === 0) {
        return res.status(404).json({
          success: false,
          error: 'Certification not found for this student',
          code: 'CERTIFICATION_NOT_FOUND'
        });
      }

      logger.info('Certification removed from student', {
        student_id: id,
        certification_id
      });

      res.json({ success: true, message: 'Certification removed successfully' });
    } catch (error) {
      logger.error('Remove certification failed:', { id, certification_id, error: error.message });
      throw error;
    }
  })
};
