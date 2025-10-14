const Joi = require('joi');
const logger = require('../utils/logger');

// Generic validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation failed:', { 
        property, 
        errors: errorDetails,
        body: req.body 
      });

      return res.status(400).json({
        error: 'Validation failed',
        details: errorDetails,
        code: 'VALIDATION_ERROR'
      });
    }

    // Replace the property with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Student validation schemas
const studentIdSchema = Joi.string()
  .pattern(/^[A-Za-z0-9._-]+$/)
  .min(4)
  .max(100)
  .messages({ 'string.pattern.base': 'student_id must contain only letters, numbers, dots, hyphens, or underscores' });

const studentCreateSchema = Joi.object({
  student_id: studentIdSchema.required(),
  first_name: Joi.string().required().max(100),
  last_name: Joi.string().required().max(100),
  email: Joi.string().email().required().max(255),
  phone: Joi.string().max(20).optional(),
  dob: Joi.date().max('now').optional(),
  gender: Joi.string().max(20).optional(),
  department_id: Joi.string().uuid().required(),
  semester: Joi.number().integer().min(1).max(8).optional(),
  cgpa: Joi.number().min(0).max(10).precision(2).optional().allow(null),
  attendance_percentage: Joi.number().min(0).max(100).precision(2).optional().allow(null),
  research_experience: Joi.boolean().default(false)
});

const studentUpdateSchema = Joi.object({
  first_name: Joi.string().max(100).optional(),
  last_name: Joi.string().max(100).optional(),
  email: Joi.string().email().max(255).optional(),
  phone: Joi.string().max(20).optional(),
  dob: Joi.date().max('now').optional(),
  gender: Joi.string().max(20).optional(),
  department_id: Joi.string().uuid().optional(),
  semester: Joi.number().integer().min(1).max(8).optional(),
  cgpa: Joi.number().min(0).max(10).precision(2).optional().allow(null),
  attendance_percentage: Joi.number().min(0).max(100).precision(2).optional().allow(null),
  research_experience: Joi.boolean().optional(),
  skills: Joi.array().items(Joi.string().uuid()).optional(),
  interests: Joi.array().items(Joi.string().uuid()).optional()
});

// Faculty validation schemas
const facultyCreateSchema = Joi.object({
  first_name: Joi.string().required().max(100),
  last_name: Joi.string().required().max(100),
  email: Joi.string().email().required().max(255),
  phone: Joi.string().max(20).optional(),
  department_id: Joi.string().uuid().required(),
  designation: Joi.string().max(100).optional(),
  specialization: Joi.string().optional()
});

const facultyUpdateSchema = Joi.object({
  first_name: Joi.string().max(100).optional(),
  last_name: Joi.string().max(100).optional(),
  email: Joi.string().email().max(255).optional(),
  phone: Joi.string().max(20).optional(),
  department_id: Joi.string().uuid().optional(),
  designation: Joi.string().max(100).optional(),
  specialization: Joi.string().optional()
});

// Company validation schemas
// Allow either a full URL (http/https) or a bare domain like "oracle.com"
const websiteSchema = Joi.alternatives()
  .try(
    Joi.string().uri({ scheme: ['http', 'https'] }).max(255),
    Joi.string()
      .pattern(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+(?:\/.*)?$/)
      .max(255)
  )
  .messages({ 'alternatives.match': 'website must be a valid URL or domain' });

const companyCreateSchema = Joi.object({
  name: Joi.string().required().max(200),
  description: Joi.string().optional(),
  website: websiteSchema.optional(),
  industry: Joi.string().max(100).optional(),
  size: Joi.string().max(50).optional(),
  location: Joi.string().max(200).optional()
});

const companyUpdateSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().optional(),
  website: websiteSchema.optional(),
  industry: Joi.string().max(100).optional(),
  size: Joi.string().max(50).optional(),
  location: Joi.string().max(200).optional()
});

// Job role validation schemas
const jobRoleCreateSchema = Joi.object({
  company_id: Joi.string().uuid().required(),
  title: Joi.string().required().max(200),
  description: Joi.string().optional(),
  requirements: Joi.string().optional(),
  salary_range: Joi.string().max(100).optional(),
  location: Joi.string().max(200).optional(),
  is_active: Joi.boolean().default(true)
});

// Placement validation schemas
const placementCreateSchema = Joi.object({
  student_id: studentIdSchema.required(),
  company_id: Joi.string().uuid().required(),
  job_role_id: Joi.string().uuid().required(),
  status: Joi.string().valid('APPLIED', 'SHORTLISTED', 'OFFERED', 'ACCEPTED', 'REJECTED').optional(),
  applied_date: Joi.date().max('now').optional(),
  offered_date: Joi.date().max('now').optional(),
  accepted_date: Joi.date().max('now').optional(),
  offer_type: Joi.string().valid('FULL_TIME', 'INTERNSHIP').optional()
}).custom((value, helpers) => {
  // If status is ACCEPTED, accepted_date must be present
  if (value.status === 'ACCEPTED' && !value.accepted_date) {
    return helpers.error('custom.acceptedDateRequired');
  }
  // If status is OFFERED or ACCEPTED, offer_type must be present
  if ((value.status === 'OFFERED' || value.status === 'ACCEPTED') && !value.offer_type) {
    return helpers.error('custom.offerTypeRequired');
  }
  return value;
}, 'Placement create validation').messages({
  'custom.acceptedDateRequired': 'accepted_date is required when status is ACCEPTED',
  'custom.offerTypeRequired': 'offer_type is required when status is OFFERED or ACCEPTED'
});

const placementStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('APPLIED', 'SHORTLISTED', 'OFFERED', 'ACCEPTED', 'REJECTED').required(),
  accepted_date: Joi.date().max('now').optional(),
  offered_date: Joi.date().max('now').optional(),
  offer_type: Joi.string().valid('FULL_TIME', 'INTERNSHIP').optional()
}).custom((value, helpers) => {
  // If status is ACCEPTED, accepted_date must be present
  if (value.status === 'ACCEPTED' && !value.accepted_date) {
    return helpers.error('custom.acceptedDateRequired');
  }
  // If status is OFFERED or ACCEPTED, offer_type must be present
  if ((value.status === 'OFFERED' || value.status === 'ACCEPTED') && !value.offer_type) {
    return helpers.error('custom.offerTypeRequired');
  }
  return value;
}, 'Placement status update validation').messages({
  'custom.acceptedDateRequired': 'accepted_date is required when status is ACCEPTED',
  'custom.offerTypeRequired': 'offer_type is required when status is OFFERED or ACCEPTED'
});

// Research project validation schemas
const researchProjectCreateSchema = Joi.object({
  title: Joi.string().required().max(300),
  description: Joi.string().optional(),
  start_date: Joi.date().max('now').optional(),
  end_date: Joi.date().min(Joi.ref('start_date')).optional(),
  faculty_id: Joi.string().uuid().required(),
  required_skill_ids: Joi.array().items(Joi.string().uuid()).optional()
});

const researchProjectParticipantSchema = Joi.object({
  student_id: studentIdSchema.required(),
  role: Joi.string().max(100).optional(),
  start_date: Joi.date().max('now').default('now'),
  end_date: Joi.date().min(Joi.ref('start_date')).optional()
});

// Club validation schemas
const clubCreateSchema = Joi.object({
  name: Joi.string().required().max(200),
  description: Joi.string().optional(),
  category: Joi.string().max(100).optional(),
  established_date: Joi.date().max('now').optional(),
  is_active: Joi.boolean().default(true)
});

const clubMemberSchema = Joi.object({
  student_id: studentIdSchema.required(),
  role: Joi.string().max(100).optional(),
  start_date: Joi.date().max('now').default('now')
});

// User validation schemas
const userCreateSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('ADMIN', 'FACULTY', 'CLUB', 'CIR', 'STUDENT').required(),
  profile_type: Joi.string().valid('STUDENT', 'FACULTY', 'CLUB', 'ADMIN').required(),
  profile_ref_id: Joi.alternatives().conditional('profile_type', {
    is: 'STUDENT',
    then: studentIdSchema.required(),
    otherwise: Joi.string().uuid().required()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Query parameter validation schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().optional(),
  order: Joi.string().valid('ASC', 'DESC').default('DESC')
});

const studentFiltersSchema = Joi.object({
  q: Joi.string().optional(),
  student_id: studentIdSchema.optional(),
  skills: Joi.string().optional(),
  interests: Joi.string().optional(),
  min_cgpa: Joi.number().min(0).max(10).optional(),
  max_cgpa: Joi.number().min(0).max(10).optional(),
  department_id: Joi.string().uuid().optional(),
  semester: Joi.number().integer().min(1).max(8).optional(),
  research_experience: Joi.boolean().optional(),
  min_attendance: Joi.number().min(0).max(100).optional()
}).concat(paginationSchema);

// Export validation functions
module.exports = {
  validate,
  
  // Student validations
  validateStudentCreate: validate(studentCreateSchema),
  validateStudentUpdate: validate(studentUpdateSchema),
  
  // Faculty validations
  validateFacultyCreate: validate(facultyCreateSchema),
  validateFacultyUpdate: validate(facultyUpdateSchema),
  
  // Company validations
  validateCompanyCreate: validate(companyCreateSchema),
  validateCompanyUpdate: validate(companyUpdateSchema),
  validateJobRoleCreate: validate(jobRoleCreateSchema),
  
  // Placement validations
  validatePlacementCreate: validate(placementCreateSchema),
  validatePlacementStatusUpdate: validate(placementStatusUpdateSchema),
  
  // Research project validations
  validateResearchProjectCreate: validate(researchProjectCreateSchema),
  validateResearchProjectParticipant: validate(researchProjectParticipantSchema),
  
  // Club validations
  validateClubCreate: validate(clubCreateSchema),
  validateClubMember: validate(clubMemberSchema),
  
  // User validations
  validateUserCreate: validate(userCreateSchema),
  validateLogin: validate(loginSchema),
  
  // Query validations
  validatePagination: validate(paginationSchema, 'query'),
  validateStudentFilters: validate(studentFiltersSchema, 'query')
};
