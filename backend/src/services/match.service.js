const { db } = require('../models');
const logger = require('../utils/logger');

class MatchService {
  // Get match settings (default if none exists)
  async getMatchSettings() {
    const query = `
      SELECT * FROM match_settings 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const result = await db.query(query);
    
    if (result.rows.length === 0) {
      // Return default settings
      return {
        skill_weight: 0.30,
        cgpa_weight: 0.25,
        attendance_weight: 0.20,
        interest_weight: 0.25
      };
    }
    
    return result.rows[0];
  }

  // Compute match score for a student against requirements
  async computeMatch(student, requirements, settings = null) {
    try {
      if (!settings) {
        settings = await this.getMatchSettings();
      }

      const {
        skill_weight = 0.30,
        cgpa_weight = 0.25,
        attendance_weight = 0.20,
        interest_weight = 0.25
      } = settings;

      // Calculate skill score
      const skillScore = this.calculateSkillScore(student.skills || [], requirements.required_skills || []);
      
      // Calculate CGPA score
      const cgpaScore = this.calculateCgpaScore(student.cgpa, requirements.min_cgpa);
      
      // Calculate attendance score
      const attendanceScore = this.calculateAttendanceScore(student.attendance_percentage, requirements.min_attendance);
      
      // Calculate interest score
      const interestScore = this.calculateInterestScore(student.interests || [], requirements.required_interests || []);

      // Calculate weighted match score
      const match_score = (
        skillScore * skill_weight +
        cgpaScore * cgpa_weight +
        attendanceScore * attendance_weight +
        interestScore * interest_weight
      );

      return {
        skillScore: Math.round(skillScore * 100) / 100,
        cgpaScore: Math.round(cgpaScore * 100) / 100,
        attendanceScore: Math.round(attendanceScore * 100) / 100,
        interestScore: Math.round(interestScore * 100) / 100,
        match_score: Math.round(match_score * 100) / 100,
        matched_skills: this.getMatchedSkills(student.skills || [], requirements.required_skills || []),
        matched_interests: this.getMatchedInterests(student.interests || [], requirements.required_interests || [])
      };
    } catch (error) {
      logger.error('Error computing match score:', error);
      throw error;
    }
  }

  // Calculate skill matching score
  calculateSkillScore(studentSkills, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) {
      return 1.0; // No skill requirements means perfect score
    }

    if (!studentSkills || studentSkills.length === 0) {
      return 0.0; // No skills means no match
    }

    const studentSkillIds = studentSkills.map(skill => skill.skill_id || skill);
    const requiredSkillIds = requiredSkills.map(skill => skill.skill_id || skill);
    
    const matchedSkills = studentSkillIds.filter(skillId => 
      requiredSkillIds.includes(skillId)
    );

    return matchedSkills.length / requiredSkillIds.length;
  }

  // Calculate CGPA score
  calculateCgpaScore(studentCgpa, minCgpa) {
    if (minCgpa === undefined || minCgpa === null) {
      return 1.0; // No CGPA requirement means perfect score
    }

    if (studentCgpa === null || studentCgpa === undefined) {
      return 0.0; // No CGPA means no match
    }

    if (studentCgpa >= minCgpa) {
      return 1.0; // Meets requirement
    }

    // Linear scaling for partial match
    return Math.max(0, studentCgpa / minCgpa);
  }

  // Calculate attendance score
  calculateAttendanceScore(studentAttendance, minAttendance) {
    if (minAttendance === undefined || minAttendance === null) {
      return 1.0; // No attendance requirement means perfect score
    }

    if (studentAttendance === null || studentAttendance === undefined) {
      return 0.0; // No attendance data means no match
    }

    if (studentAttendance >= minAttendance) {
      return 1.0; // Meets requirement
    }

    // Linear scaling for partial match
    return Math.max(0, studentAttendance / minAttendance);
  }

  // Calculate interest matching score
  calculateInterestScore(studentInterests, requiredInterests) {
    if (!requiredInterests || requiredInterests.length === 0) {
      return 1.0; // No interest requirements means perfect score
    }

    if (!studentInterests || studentInterests.length === 0) {
      return 0.0; // No interests means no match
    }

    const studentInterestIds = studentInterests.map(interest => interest.interest_id || interest);
    const requiredInterestIds = requiredInterests.map(interest => interest.interest_id || interest);
    
    const matchedInterests = studentInterestIds.filter(interestId => 
      requiredInterestIds.includes(interestId)
    );

    return matchedInterests.length / requiredInterestIds.length;
  }

  // Get matched skills
  getMatchedSkills(studentSkills, requiredSkills) {
    if (!studentSkills || !requiredSkills) return [];
    
    const studentSkillIds = studentSkills.map(skill => skill.skill_id || skill);
    const requiredSkillIds = requiredSkills.map(skill => skill.skill_id || skill);
    
    return studentSkills.filter(skill => 
      requiredSkillIds.includes(skill.skill_id || skill)
    );
  }

  // Get matched interests
  getMatchedInterests(studentInterests, requiredInterests) {
    if (!studentInterests || !requiredInterests) return [];
    
    const studentInterestIds = studentInterests.map(interest => interest.interest_id || interest);
    const requiredInterestIds = requiredInterests.map(interest => interest.interest_id || interest);
    
    return studentInterests.filter(interest => 
      requiredInterestIds.includes(interest.interest_id || interest)
    );
  }

  // Find candidates for a company
  async findCandidatesForCompany(companyId, filters = {}, pagination = {}) {
    try {
      const {
        min_cgpa,
        min_attendance,
        required_skills = [],
        required_interests = [],
        page = 1,
        limit = 20
      } = filters;

      const offset = (page - 1) * limit;

      // Get company job roles
      const companyQuery = `
        SELECT cjr.*, c.name as company_name
        FROM company_job_roles cjr
        JOIN companies c ON cjr.company_id = c.company_id
        WHERE cjr.company_id = ? AND cjr.is_active = true
      `;
      
      const companyResult = await db.query(companyQuery, [companyId]);
      if (companyResult.rows.length === 0) {
        return { candidates: [], total: 0 };
      }

      // Get all students with their skills and interests
      const studentsQuery = `
        SELECT 
          s.*,
          d.name as department_name,
          COALESCE(
            (
              SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'skill_id', sk.skill_id,
                'name', sk.name,
                'proficiency_level', ss.proficiency_level
              ))
              FROM student_skills ss
              JOIN skills sk ON ss.skill_id = sk.skill_id
              WHERE ss.student_id = s.student_id
            ), JSON_ARRAY()
          ) AS skills,
          COALESCE(
            (
              SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'interest_id', i.interest_id,
                'name', i.name
              ))
              FROM student_interests si
              JOIN interests i ON si.interest_id = i.interest_id
              WHERE si.student_id = s.student_id
            ), JSON_ARRAY()
          ) AS interests
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.department_id
        ORDER BY s.created_at DESC
      `;

      const studentsResult = await db.query(studentsQuery);
      const students = studentsResult.rows;

      // Get match settings
      const settings = await this.getMatchSettings();

      // Calculate match scores for each student
      const candidates = [];
      for (const student of students) {
        const requirements = {
          min_cgpa,
          min_attendance,
          required_skills,
          required_interests
        };

        const matchResult = await this.computeMatch(student, requirements, settings);
        
        candidates.push({
          ...student,
          ...matchResult,
          matched_skills_count: matchResult.matched_skills.length,
          matched_interests_count: matchResult.matched_interests.length
        });
      }

      // Sort by match score (descending)
      candidates.sort((a, b) => b.match_score - a.match_score);

      // Apply pagination
      const total = candidates.length;
      const paginatedCandidates = candidates.slice(offset, offset + limit);

      return {
        candidates: paginatedCandidates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error finding candidates for company:', error);
      throw error;
    }
  }

  // Find candidates for a club
  async findCandidatesForClub(clubId, filters = {}, pagination = {}) {
    try {
      // Get club requirements (if any)
      const clubQuery = `
        SELECT c.*, 
          COALESCE(
            (
              SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'skill_id', s.skill_id,
                'name', s.name
              ))
              FROM club_required_skills crs
              JOIN skills s ON crs.skill_id = s.skill_id
              WHERE crs.club_id = c.club_id
            ), JSON_ARRAY()
          ) AS required_skills,
          COALESCE(
            (
              SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'interest_id', i.interest_id,
                'name', i.name
              ))
              FROM club_required_interests cri
              JOIN interests i ON cri.interest_id = i.interest_id
              WHERE cri.club_id = c.club_id
            ), JSON_ARRAY()
          ) AS required_interests
        FROM clubs c
        WHERE c.club_id = ?
      `;

      const clubResult = await db.query(clubQuery, [clubId]);
      if (clubResult.rows.length === 0) {
        return { candidates: [], total: 0 };
      }

      const club = clubResult.rows[0];
      
      // Use club requirements in filters
      const enhancedFilters = {
        ...filters,
        required_skills: filters.required_skills || club.required_skills,
        required_interests: filters.required_interests || club.required_interests
      };

      // Use the same logic as company candidates
      return await this.findCandidatesForCompany(null, enhancedFilters, pagination);
    } catch (error) {
      logger.error('Error finding candidates for club:', error);
      throw error;
    }
  }
}

module.exports = new MatchService();
