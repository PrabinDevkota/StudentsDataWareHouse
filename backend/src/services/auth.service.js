const jwt = require('jsonwebtoken');
const config = require('../config/env');
const usersModel = require('../models/users.model');
const clubsModel = require('../models/clubs.model');
const logger = require('../utils/logger');

class AuthService {
  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, { 
      expiresIn: config.jwt.expiresIn 
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const user = await usersModel.verifyPassword(email, password);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Update last login
      await usersModel.updateLastLogin(user.user_id);

      // Generate token
      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        profile_ref_id: user.profile_ref_id,
        profile_type: user.profile_type
      };

      const token = this.generateToken(tokenPayload);

      return {
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          profile_ref_id: user.profile_ref_id,
          profile_type: user.profile_type,
          is_active: user.is_active
        },
        access_token: token,
        refresh_token: user.refresh_token
      };
    } catch (error) {
      logger.error('Login failed:', { email, error: error.message });
      throw error;
    }
  }

  // Club login (club_id only)
  async clubLogin(clubId) {
    try {
      const trimmedId = (clubId || '').trim();
      if (!trimmedId) {
        throw new Error('Invalid club credentials');
      }

      // Verify club exists
      const clubRes = await clubsModel.query('SELECT club_id, name, category FROM clubs WHERE club_id = ?', [trimmedId]);
      const club = clubRes.rows[0];
      if (!club) {
        throw new Error('Invalid club credentials');
      }

      // Find existing user linked to this club
      const userRes = await usersModel.query(
        "SELECT * FROM users WHERE profile_type = 'CLUB' AND profile_ref_id = ?",
        [trimmedId]
      );
      let user = userRes.rows[0];

      // If user does not exist, create a synthetic one
      if (!user) {
        const syntheticEmail = `club_${trimmedId}@club.local`;
        user = await usersModel.createUser({
          email: syntheticEmail,
          password: trimmedId, // not used for login; stored hashed
          role: 'CLUB',
          profile_type: 'CLUB',
          profile_ref_id: trimmedId,
        });
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      await usersModel.updateLastLogin(user.user_id);

      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        role: 'CLUB',
        profile_ref_id: trimmedId,
        profile_type: 'CLUB'
      };

      const token = this.generateToken(tokenPayload);

      return {
        user: {
          ...tokenPayload,
          is_active: true,
        },
        access_token: token,
        refresh_token: user.refresh_token || null,
      };
    } catch (error) {
      logger.error('Club login failed:', { club_id: clubId, error: error.message });
      throw error;
    }
  }

  // Student login (email + name authentication)
  async studentLogin(email, name) {
    try {
      // 1) Find student by email
      const studentRes = await usersModel.query(
        'SELECT student_id, first_name, last_name, email FROM students WHERE email = ?',
        [email]
      );
      const student = studentRes.rows[0];

      if (!student) {
        throw new Error('Invalid student credentials');
      }

      const provided = (name || '').trim().toLowerCase();
      const full = `${student.first_name} ${student.last_name}`.trim().toLowerCase();
      const first = (student.first_name || '').trim().toLowerCase();

      if (!(provided === first || provided === full)) {
        throw new Error('Invalid student credentials');
      }

      // 2) Ensure users row exists and is linked
      let user = await usersModel.findByEmail(email);
      if (!user) {
        user = await usersModel.createUser({
          email: student.email,
          password: student.first_name,
          role: 'STUDENT',
          profile_type: 'STUDENT',
          profile_ref_id: student.student_id,
        });
      } else if (!user.profile_ref_id) {
        await usersModel.update(user.user_id, {
          role: 'STUDENT',
          profile_type: 'STUDENT',
          profile_ref_id: student.student_id,
          is_active: true,
        });
        user = await usersModel.findByEmail(email);
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      await usersModel.updateLastLogin(user.user_id);

      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        role: 'STUDENT',
        profile_ref_id: student.student_id,
        profile_type: 'STUDENT'
      };

      const token = this.generateToken(tokenPayload);

      return {
        user: {
          ...tokenPayload,
          is_active: true,
        },
        access_token: token,
        refresh_token: user.refresh_token || null,
      };
    } catch (error) {
      logger.error('Student login failed:', { email, error: error.message });
      throw error;
    }
  }

  // Faculty login (email + name authentication)
  async facultyLogin(email, name) {
    try {
      // 1) Find faculty by email
      const facultyRes = await usersModel.query(
        'SELECT faculty_id, first_name, last_name, email FROM faculty WHERE email = ?',
        [email]
      );
      const faculty = facultyRes.rows[0];

      if (!faculty) {
        throw new Error('Invalid faculty credentials');
      }

      const provided = (name || '').trim().toLowerCase();
      const full = `${faculty.first_name} ${faculty.last_name}`.trim().toLowerCase();
      const first = (faculty.first_name || '').trim().toLowerCase();

      if (!(provided === first || provided === full)) {
        throw new Error('Invalid faculty credentials');
      }

      // 2) Ensure users row exists and is linked
      let user = await usersModel.findByEmail(email);
      if (!user) {
        user = await usersModel.createUser({
          email: faculty.email,
          password: faculty.first_name,
          role: 'FACULTY',
          profile_type: 'FACULTY',
          profile_ref_id: faculty.faculty_id,
        });
      } else if (!user.profile_ref_id) {
        await usersModel.update(user.user_id, {
          role: 'FACULTY',
          profile_type: 'FACULTY',
          profile_ref_id: faculty.faculty_id,
          is_active: true,
        });
        user = await usersModel.findByEmail(email);
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      await usersModel.updateLastLogin(user.user_id);

      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        role: 'FACULTY',
        profile_ref_id: faculty.faculty_id,
        profile_type: 'FACULTY'
      };

      const token = this.generateToken(tokenPayload);

      return {
        user: {
          ...tokenPayload,
          is_active: true,
        },
        access_token: token,
        refresh_token: user.refresh_token || null,
      };
    } catch (error) {
      logger.error('Faculty login failed:', { email, error: error.message });
      throw error;
    }
  }

  // Register user (ADMIN only)
  async register(userData) {
    try {
      const { email, password, role, profile_type, profile_ref_id } = userData;

      // Check if user already exists
      const existingUser = await usersModel.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Validate profile reference exists
      await this.validateProfileReference(profile_type, profile_ref_id);

      // Create user
      const user = await usersModel.createUser({
        email,
        password,
        role,
        profile_type,
        profile_ref_id
      });

      return user;
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  // Validate profile reference exists
  async validateProfileReference(profileType, profileRefId) {
    let query, tableName;

    switch (profileType) {
      case 'STUDENT':
        tableName = 'students';
        query = 'SELECT student_id FROM students WHERE student_id = ?';
        break;
      case 'FACULTY':
        tableName = 'faculty';
        query = 'SELECT faculty_id FROM faculty WHERE faculty_id = ?';
        break;
      case 'CLUB':
        tableName = 'clubs';
        query = 'SELECT club_id FROM clubs WHERE club_id = ?';
        break;
      default:
        throw new Error('Invalid profile type');
    }

    const result = await usersModel.query(query, [profileRefId]);
    if (result.rows.length === 0) {
      throw new Error(`${profileType} with ID ${profileRefId} not found`);
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const user = await usersModel.getUserWithProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      logger.error('Get user profile failed:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await usersModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValid = await usersModel.verifyPassword(user.email, currentPassword);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await usersModel.updatePassword(userId, newPassword);
      
      return { message: 'Password updated successfully' };
    } catch (error) {
      logger.error('Change password failed:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(userId) {
    try {
      const user = await usersModel.findById(userId);
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        profile_ref_id: user.profile_ref_id,
        profile_type: user.profile_type
      };

      const token = this.generateToken(tokenPayload);
      return { token };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
