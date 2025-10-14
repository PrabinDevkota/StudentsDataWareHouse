const { Pool } = require('pg');
const config = require('../src/config/env');
const logger = require('../src/utils/logger');

// Database connection
const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.server.env === 'production' ? { rejectUnauthorized: false } : false
});

// Basic seed data
const seedData = {
  departments: [
    { name: 'Computer Science and Engineering', code: 'CSE', description: 'Department of Computer Science and Engineering' },
    { name: 'Electrical and Electronics Engineering', code: 'EEE', description: 'Department of Electrical and Electronics Engineering' },
    { name: 'Electronics and Communication Engineering', code: 'ECE', description: 'Department of Electronics and Communication Engineering' },
    { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' }
  ],
  
  skills: [
    { name: 'Python', description: 'Python programming language', category: 'Programming' },
    { name: 'Java', description: 'Java programming language', category: 'Programming' },
    { name: 'JavaScript', description: 'JavaScript programming language', category: 'Programming' },
    { name: 'Machine Learning', description: 'Machine Learning algorithms and techniques', category: 'AI/ML' },
    { name: 'Artificial Intelligence', description: 'Artificial Intelligence concepts and applications', category: 'AI/ML' },
    { name: 'Data Science', description: 'Data Science and analytics', category: 'Data' },
    { name: 'Web Development', description: 'Web development technologies', category: 'Development' },
    { name: 'Mobile Development', description: 'Mobile app development', category: 'Development' },
    { name: 'Database Management', description: 'Database design and management', category: 'Database' },
    { name: 'Cloud Computing', description: 'Cloud platforms and services', category: 'Infrastructure' }
  ],
  
  interests: [
    { name: 'Research', description: 'Academic and scientific research', category: 'Academic' },
    { name: 'Robotics', description: 'Robotics and automation', category: 'Technology' },
    { name: 'Music', description: 'Music and performing arts', category: 'Arts' },
    { name: 'Sports', description: 'Sports and physical activities', category: 'Physical' },
    { name: 'Startups', description: 'Entrepreneurship and startups', category: 'Business' },
    { name: 'Photography', description: 'Photography and visual arts', category: 'Arts' },
    { name: 'Gaming', description: 'Video games and gaming', category: 'Entertainment' },
    { name: 'Travel', description: 'Travel and exploration', category: 'Lifestyle' }
  ],
  
  companies: [
    { 
      name: 'TechCorp Solutions', 
      description: 'Leading technology solutions provider',
      website: 'https://techcorp.com',
      industry: 'Technology',
      size: 'Large',
      location: 'Bangalore, India'
    },
    { 
      name: 'DataFlow Systems', 
      description: 'Data analytics and business intelligence company',
      website: 'https://dataflow.com',
      industry: 'Data Analytics',
      size: 'Medium',
      location: 'Mumbai, India'
    },
    { 
      name: 'CloudTech Innovations', 
      description: 'Cloud computing and infrastructure services',
      website: 'https://cloudtech.com',
      industry: 'Cloud Computing',
      size: 'Large',
      location: 'Hyderabad, India'
    }
  ],
  
  clubs: [
    { 
      name: 'Coding Club', 
      description: 'Programming and software development club',
      category: 'Technology',
      established_date: '2020-01-15'
    },
    { 
      name: 'Robotics Society', 
      description: 'Robotics and automation enthusiasts',
      category: 'Technology',
      established_date: '2019-09-01'
    },
    { 
      name: 'Music Society', 
      description: 'Music and performing arts club',
      category: 'Arts',
      established_date: '2018-03-10'
    },
    { 
      name: 'Sports Club', 
      description: 'Sports and physical activities club',
      category: 'Sports',
      established_date: '2017-08-20'
    }
  ],
  
  matchSettings: {
    name: 'Default Matching Settings',
    skill_weight: 0.30,
    cgpa_weight: 0.25,
    attendance_weight: 0.20,
    interest_weight: 0.25
  }
};

// Seed function
const seed = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    logger.info('Starting database seeding...');
    
    // Seed departments
    logger.info('Seeding departments...');
    for (const dept of seedData.departments) {
      await client.query(
        'INSERT INTO departments (name, code, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [dept.name, dept.code, dept.description]
      );
    }
    
    // Seed skills
    logger.info('Seeding skills...');
    for (const skill of seedData.skills) {
      await client.query(
        'INSERT INTO skills (name, description, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [skill.name, skill.description, skill.category]
      );
    }
    
    // Seed interests
    logger.info('Seeding interests...');
    for (const interest of seedData.interests) {
      await client.query(
        'INSERT INTO interests (name, description, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [interest.name, interest.description, interest.category]
      );
    }
    
    // Seed companies
    logger.info('Seeding companies...');
    for (const company of seedData.companies) {
      await client.query(
        'INSERT INTO companies (name, description, website, industry, size, location) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (name) DO NOTHING',
        [company.name, company.description, company.website, company.industry, company.size, company.location]
      );
    }
    
    // Seed clubs
    logger.info('Seeding clubs...');
    for (const club of seedData.clubs) {
      await client.query(
        'INSERT INTO clubs (name, description, category, established_date) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING',
        [club.name, club.description, club.category, club.established_date]
      );
    }
    
    // Seed match settings
    logger.info('Seeding match settings...');
    await client.query(
      'INSERT INTO match_settings (name, skill_weight, cgpa_weight, attendance_weight, interest_weight) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING',
      [seedData.matchSettings.name, seedData.matchSettings.skill_weight, seedData.matchSettings.cgpa_weight, seedData.matchSettings.attendance_weight, seedData.matchSettings.interest_weight]
    );
    
    await client.query('COMMIT');
    logger.info('Database seeding completed successfully');
    
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
  seed().catch(error => {
    logger.error('Seeding process failed:', error);
    process.exit(1);
  });
}

module.exports = { seed };
