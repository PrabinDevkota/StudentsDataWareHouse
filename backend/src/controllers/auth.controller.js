const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await authService.login(email, password);

    logger.info('User logged in successfully', { email, role: result.user.role });

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    logger.error('Login failed:', { email, error: error.message });

    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('invalid credentials')) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    if (msg.includes('account is deactivated')) {
      return res.status(403).json({ success: false, error: 'Account is deactivated' });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Student login (email + name authentication)
const studentLogin = asyncHandler(async (req, res) => {
  const { email, name } = req.body;

  try {
    const result = await authService.studentLogin((email || '').trim(), (name || '').trim());
    
    logger.info('Student logged in successfully', { email, student_id: result.user.profile_ref_id });
    
    res.json({
      success: true,
      message: 'Student login successful',
      data: result
    });
  } catch (error) {
    logger.error('Student login failed:', { email, error: error.message });
    if (error && error.message === 'Invalid student credentials') {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Faculty login (email + name authentication)
const facultyLogin = asyncHandler(async (req, res) => {
  const { email, name } = req.body;

  try {
    const result = await authService.facultyLogin((email || '').trim(), (name || '').trim());
    
    logger.info('Faculty logged in successfully', { email, faculty_id: result.user.profile_ref_id });
    
    res.json({
      success: true,
      message: 'Faculty login successful',
      data: result
    });
  } catch (error) {
    logger.error('Faculty login failed:', { email, error: error.message });
    if (error && error.message === 'Invalid faculty credentials') {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Club login (club_id only)
const clubLogin = asyncHandler(async (req, res) => {
  const { club_id } = req.body;

  try {
    const result = await authService.clubLogin((club_id || '').trim());

    logger.info('Club logged in successfully', { club_id: result.user.profile_ref_id });

    res.json({
      success: true,
      message: 'Club login successful',
      data: result
    });
  } catch (error) {
    logger.error('Club login failed:', { club_id, error: error.message });
    if (error && error.message === 'Invalid club credentials') {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Register user (ADMIN only)
const register = asyncHandler(async (req, res) => {
  const userData = req.body;

  try {
    const user = await authService.register(userData);
    
    logger.info('User registered successfully', { 
      email: user.email, 
      role: user.role,
      profile_type: user.profile_type 
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        profile_type: user.profile_type,
        profile_ref_id: user.profile_ref_id,
        is_active: user.is_active,
        created_at: user.created_at
      }
    });
  } catch (error) {
    logger.error('Registration failed:', { 
      email: userData.email, 
      error: error.message 
    });
    throw error;
  }
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const { user_id } = req.user;

  try {
    const profile = await authService.getUserProfile(user_id);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Get profile failed:', { user_id, error: error.message });
    throw error;
  }
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { user_id } = req.user;
  const { current_password, new_password } = req.body;

  try {
    await authService.changePassword(user_id, current_password, new_password);
    
    logger.info('Password changed successfully', { user_id });
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password failed:', { user_id, error: error.message });
    throw error;
  }
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  const { user_id } = req.user;

  try {
    const result = await authService.refreshToken(user_id);
    
    logger.info('Token refreshed successfully', { user_id });
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Token refresh failed:', { user_id, error: error.message });
    throw error;
  }
});

// Logout (client-side token removal)
const logout = asyncHandler(async (req, res) => {
  logger.info('User logged out', { user_id: req.user?.user_id });
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = {
  login,
  studentLogin,
  facultyLogin,
  clubLogin,
  register,
  getProfile,
  changePassword,
  refreshToken,
  logout
};
