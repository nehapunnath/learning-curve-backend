// controllers/AuthController.js
const AuthModel = require('../Models/AuthModel');

class AuthController {
  
  // Login with email and password
  // controllers/AuthController.js
static async login(req, res) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const result = await AuthModel.verifyIdToken(idToken);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error || 'Invalid token'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result   // result already has all user data
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
  // Get current user profile
  static async getProfile(req, res) {
    try {
      // User should be attached by middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const profile = await AuthModel.getUserProfile(req.user.uid);

      const userData = {
        uid: req.user.uid,
        email: req.user.email,
        name: profile.name || req.user.name,
        isAdmin: req.user.isAdmin || profile.isAdmin,
        role: req.user.role || profile.role || 'user',
        schoolId: req.user.schoolId || profile.schoolId,
        fullAccess: req.user.fullAccess || profile.fullAccess || false,
        enabledTabs: req.user.enabledTabs || profile.enabledTabs || [],
        picture: profile.picture || req.user.picture,
        createdAt: profile.createdAt,
        lastLogin: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        user: userData
      });

    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch profile'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { name, picture, enabledTabs } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (picture) updateData.picture = picture;
      if (enabledTabs) updateData.enabledTabs = enabledTabs;
      updateData.updatedAt = new Date().toISOString();

      const result = await AuthModel.updateUserProfile(req.user.uid, updateData);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  // Logout (for session-based auth)
  static async logout(req, res) {
    try {
      // If using sessions, destroy the session here
      // req.session.destroy();
      
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }
  }

  // Create new admin user (super admin only)
  static async createAdmin(req, res) {
    try {
      // Check if current user is super admin
      if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized. Only super admin can create admin users.'
        });
      }

      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and name are required'
        });
      }

      const result = await AuthModel.createAdminUser(email, password, name, role || 'admin');

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        user: result.user
      });

    } catch (error) {
      console.error('Create admin error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create admin user'
      });
    }
  }

  // Verify token (for token-based auth)
  static async verifyToken(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'ID token is required'
        });
      }

      const result = await AuthModel.verifyIdToken(idToken);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        user: result
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify token'
      });
    }
  }
}

module.exports = AuthController;