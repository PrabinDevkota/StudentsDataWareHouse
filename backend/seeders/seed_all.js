const faker = require('faker');
const { Pool } = require('pg');
const config = require('../src/config/env');
const logger = require('../src/utils/logger');

// Database connection
const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.server.env === 'production' ? { rejectUnauthorized: false } : false
});

// Configuration
const CONFIG = {
  STUDENT_COUNT: 20,
  FACULTY_COUNT: 8,
  RESEARCH_PROJECTS_COUNT: 15,
  INTERNSHIPS_PER_STUDENT: { min: 0, max: 3 },
  ACHIEVEMENTS_PER_STUDENT: { min: 0, max: 5 },
  CERTIFICATIONS_PER_STUDENT: { min: 0, max: 4 },
  PUBLICATIONS_PER_STUDENT: { min: 0, max: 2 },
  PLACEMENTS_COUNT: 25
};

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Seed departments
const seedDepartments = async (client) => {
  logger.info('Seeding departments...');
  
  const departments = [
    { name: 'Computer Science and Engineering', code: 'CSE' },
    { name: 'Electrical and Electronics Engineering', code: 'EEE' },
    { name: 'Electronics and Communication Engineering', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'MECH' }
  ];
  
  for (const dept of departments) {
    await client.query(
      'INSERT INTO departments (name, code) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [dept.name, dept.code]
    );
  }
  
  return await client.query('SELECT department_id, name FROM departments');
};

// Seed skills
const seedSkills = async (client) => {
  logger.info('Seeding skills...');
  
  const skills = [
    { name: 'Python', category: 'Programming' },
    { name: 'Java', category: 'Programming' },
    { name: 'JavaScript', category: 'Programming' },
    { name: 'C++', category: 'Programming' },
    { name: 'Machine Learning', category: 'AI/ML' },
    { name: 'Artificial Intelligence', category: 'AI/ML' },
    { name: 'Data Science', category: 'Data' },
    { name: 'Web Development', category: 'Development' },
    { name: 'Mobile Development', category: 'Development' },
    { name: 'Database Management', category: 'Database' },
    { name: 'Cloud Computing', category: 'Infrastructure' },
    { name: 'DevOps', category: 'Infrastructure' },
    { name: 'Cybersecurity', category: 'Security' },
    { name: 'Blockchain', category: 'Technology' },
    { name: 'IoT', category: 'Technology' },
    { name: 'Communication', category: 'Soft Skills' },
    { name: 'Leadership', category: 'Soft Skills' },
    { name: 'Project Management', category: 'Soft Skills' }
  ];
  
  for (const skill of skills) {
    await client.query(
      'INSERT INTO skills (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [skill.name, skill.category]
    );
  }
  
  return await client.query('SELECT skill_id, name FROM skills');
};

// Seed interests
const seedInterests = async (client) => {
  logger.info('Seeding interests...');
  
  const interests = [
    { name: 'Research', category: 'Academic' },
    { name: 'Robotics', category: 'Technology' },
    { name: 'Music', category: 'Arts' },
    { name: 'Sports', category: 'Physical' },
    { name: 'Startups', category: 'Business' },
    { name: 'Photography', category: 'Arts' },
    { name: 'Gaming', category: 'Entertainment' },
    { name: 'Travel', category: 'Lifestyle' },
    { name: 'Cooking', category: 'Lifestyle' },
    { name: 'Reading', category: 'Academic' }
  ];
  
  for (const interest of interests) {
    await client.query(
      'INSERT INTO interests (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [interest.name, interest.category]
    );
  }
  
  return await client.query('SELECT interest_id, name FROM interests');
};

// Seed companies
const seedCompanies = async (client) => {
  logger.info('Seeding companies...');
  
  const companies = [
    { name: 'TechCorp Solutions', industry: 'Technology', size: 'Large' },
    { name: 'DataFlow Systems', industry: 'Data Analytics', size: 'Medium' },
    { name: 'CloudTech Innovations', industry: 'Cloud Computing', size: 'Large' },
    { name: 'AI Dynamics', industry: 'Artificial Intelligence', size: 'Medium' },
    { name: 'StartupX', industry: 'Technology', size: 'Small' }
  ];
  
  for (const company of companies) {
    await client.query(
      'INSERT INTO companies (name, industry, size, location) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING',
      [company.name, company.industry, company.size, faker.address.city()]
    );
  }
  
  return await client.query('SELECT company_id, name FROM companies');
};

// Seed faculty
const seedFaculty = async (client, departments) => {
  logger.info('Seeding faculty...');
  
  const faculty = [];
  
  for (let i = 0; i < CONFIG.FACULTY_COUNT; i++) {
    const dept = getRandomElement(departments.rows);
    const facultyData = {
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.phoneNumber().substring(0, 20),
      department_id: dept.department_id,
      designation: getRandomElement(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer']),
      specialization: faker.lorem.words(3)
    };
    
    const result = await client.query(
      'INSERT INTO faculty (first_name, last_name, email, phone, department_id, designation, specialization) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING faculty_id',
      [facultyData.first_name, facultyData.last_name, facultyData.email, facultyData.phone, facultyData.department_id, facultyData.designation, facultyData.specialization]
    );
    
    faculty.push({ ...facultyData, faculty_id: result.rows[0].faculty_id });
  }
  
  return faculty;
};

// Seed students
const seedStudents = async (client, departments) => {
  logger.info('Seeding students...');
  
  const students = [];
  
  for (let i = 0; i < CONFIG.STUDENT_COUNT; i++) {
    const dept = getRandomElement(departments.rows);
    const semester = getRandomInt(1, 8);
    
    // Create edge cases
    let cgpa = null;
    let attendance = null;
    
    if (Math.random() < 0.1) { // 10% chance of null values
      cgpa = null;
      attendance = null;
    } else {
      cgpa = getRandomFloat(0, 10);
      attendance = getRandomFloat(0, 100);
      
      // Create edge cases for extreme values
      if (Math.random() < 0.05) { // 5% chance of extreme values
        cgpa = Math.random() < 0.5 ? 0.00 : 10.00;
        attendance = Math.random() < 0.5 ? 0 : 100;
      }
    }
    
    const studentData = {
      student_id: `STU${String(i + 1).padStart(4, '0')}`,
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.phoneNumber().substring(0, 20),
      dob: faker.date.between('1995-01-01', '2005-12-31'),
      gender: getRandomElement(['Male', 'Female', 'Other']),
      department_id: dept.department_id,
      semester,
      cgpa,
      attendance_percentage: attendance,
      research_experience: Math.random() < 0.3 // 30% have research experience
    };
    
    const result = await client.query(
      'INSERT INTO students (student_id, first_name, last_name, email, phone, dob, gender, department_id, semester, cgpa, attendance_percentage, research_experience) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING student_id',
      [studentData.student_id, studentData.first_name, studentData.last_name, studentData.email, studentData.phone, studentData.dob, studentData.gender, studentData.department_id, studentData.semester, studentData.cgpa, studentData.attendance_percentage, studentData.research_experience]
    );
    
    students.push({ ...studentData, student_id: result.rows[0].student_id });
  }
  
  return students;
};

// Seed student skills and interests
const seedStudentRelations = async (client, students, skills, interests) => {
  logger.info('Seeding student skills and interests...');
  
  for (const student of students) {
    // Add random skills (0-8 skills per student)
    const studentSkills = getRandomElements(skills.rows, getRandomInt(0, 8));
    for (const skill of studentSkills) {
      const proficiency = getRandomElement(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']);
      await client.query(
        'INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES ($1, $2, $3) ON CONFLICT (student_id, skill_id) DO NOTHING',
        [student.student_id, skill.skill_id, proficiency]
      );
    }
    
    // Add random interests (0-5 interests per student)
    const studentInterests = getRandomElements(interests.rows, getRandomInt(0, 5));
    for (const interest of studentInterests) {
      await client.query(
        'INSERT INTO student_interests (student_id, interest_id) VALUES ($1, $2) ON CONFLICT (student_id, interest_id) DO NOTHING',
        [student.student_id, interest.interest_id]
      );
    }
  }
};

// Seed research projects
const seedResearchProjects = async (client, faculty, skills) => {
  logger.info('Seeding research projects...');
  
  const projects = [];
  
  for (let i = 0; i < CONFIG.RESEARCH_PROJECTS_COUNT; i++) {
    const faculty_member = getRandomElement(faculty);
    const startDate = faker.date.past(2);
    const endDate = faker.date.future(1, startDate);
    
    const projectData = {
      title: faker.lorem.sentence(4),
      description: faker.lorem.paragraphs(2),
      start_date: startDate,
      end_date: endDate,
      faculty_id: faculty_member.faculty_id,
      status: getRandomElement(['ACTIVE', 'COMPLETED', 'CANCELLED'])
    };
    
    const result = await client.query(
      'INSERT INTO research_projects (title, description, start_date, end_date, faculty_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING project_id',
      [projectData.title, projectData.description, projectData.start_date, projectData.end_date, projectData.faculty_id, projectData.status]
    );
    
    const project_id = result.rows[0].project_id;
    projects.push({ ...projectData, project_id });
    
    // Add required skills
    const requiredSkills = getRandomElements(skills.rows, getRandomInt(1, 5));
    for (const skill of requiredSkills) {
      await client.query(
        'INSERT INTO research_project_required_skills (project_id, skill_id) VALUES ($1, $2) ON CONFLICT (project_id, skill_id) DO NOTHING',
        [project_id, skill.skill_id]
      );
    }
  }
  
  return projects;
};

// Seed placements
const seedPlacements = async (client, students, companies) => {
  logger.info('Seeding placements...');
  
  // Create job roles for companies
  const jobRoles = [];
  for (const company of companies.rows) {
    const roleCount = getRandomInt(2, 5);
    for (let i = 0; i < roleCount; i++) {
      const result = await client.query(
        'INSERT INTO company_job_roles (company_id, title, description, salary_range, location) VALUES ($1, $2, $3, $4, $5) RETURNING job_role_id',
        [
          company.company_id,
          faker.name.jobTitle(),
          faker.lorem.paragraph(),
          `${getRandomInt(3, 15)}-${getRandomInt(15, 30)} LPA`,
          faker.address.city()
        ]
      );
      jobRoles.push({ ...result.rows[0], company_id: company.company_id });
    }
  }
  
  // Create placements
  const selectedStudents = getRandomElements(students, CONFIG.PLACEMENTS_COUNT);
  const statuses = ['APPLIED', 'SHORTLISTED', 'OFFERED', 'ACCEPTED', 'REJECTED'];
  
  for (const student of selectedStudents) {
    const company = getRandomElement(companies.rows);
    const jobRole = getRandomElement(jobRoles.filter(r => r.company_id === company.company_id));
    const status = getRandomElement(statuses);
    const appliedDate = faker.date.past(1);
    
    let placementData = {
      student_id: student.student_id,
      company_id: company.company_id,
      job_role_id: jobRole.job_role_id,
      status,
      applied_date: appliedDate
    };
    
    // Add status-specific dates
    if (['SHORTLISTED', 'OFFERED', 'ACCEPTED', 'REJECTED'].includes(status)) {
      placementData.shortlisted_date = faker.date.between(appliedDate, new Date());
    }
    if (['OFFERED', 'ACCEPTED', 'REJECTED'].includes(status)) {
      placementData.offered_date = faker.date.between(placementData.shortlisted_date || appliedDate, new Date());
    }
    if (status === 'ACCEPTED') {
      placementData.accepted_date = faker.date.between(placementData.offered_date, new Date());
    }
    if (status === 'REJECTED') {
      placementData.rejected_date = faker.date.between(placementData.offered_date, new Date());
    }
    
    await client.query(
      'INSERT INTO placements (student_id, company_id, job_role_id, status, applied_date, shortlisted_date, offered_date, accepted_date, rejected_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        placementData.student_id,
        placementData.company_id,
        placementData.job_role_id,
        placementData.status,
        placementData.applied_date,
        placementData.shortlisted_date || null,
        placementData.offered_date || null,
        placementData.accepted_date || null,
        placementData.rejected_date || null
      ]
    );
  }
};

// Main seeding function
const seedAll = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    logger.info('Starting comprehensive database seeding...');
    
    // Clear existing data if --force flag is provided
    if (process.argv.includes('--force')) {
      logger.info('Force flag detected. Clearing existing data...');
      await client.query('TRUNCATE TABLE placements, research_project_participants, research_project_required_skills, research_projects, internships, achievements, certifications, publications, club_memberships, student_skills, student_interests, students, faculty, company_job_roles, companies, clubs, skills, interests, departments, users, match_settings CASCADE');
    }
    
    // Seed in order
    const departments = await seedDepartments(client);
    const skills = await seedSkills(client);
    const interests = await seedInterests(client);
    const companies = await seedCompanies(client);
    const faculty = await seedFaculty(client, departments);
    const students = await seedStudents(client, departments);
    
    await seedStudentRelations(client, students, skills, interests);
    const projects = await seedResearchProjects(client, faculty, skills);
    await seedPlacements(client, students, companies);
    
    await client.query('COMMIT');
    logger.info('Comprehensive database seeding completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Database seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run seeding if this script is executed directly
if (require.main === module) {
  seedAll().catch(error => {
    logger.error('Seeding process failed:', error);
    process.exit(1);
  });
}

module.exports = { seedAll };
