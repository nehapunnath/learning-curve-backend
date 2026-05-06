// middleware/AuthMiddleware.js
const { admin } = require('../config/firebaseAdmin');
const AuthModel = require('../models/AuthModel');

// Middleware to require authentication
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
   
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
   
    // Get profile
    const profile = await AuthModel.getUserProfile(decodedToken.uid);
   
    // Attach user with proper admin check
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: profile.name || decodedToken.name,
      role: profile.role || decodedToken.role || 'user',
      isAdmin: profile.isAdmin || decodedToken.admin === true || false,
      schoolId: profile.schoolId || decodedToken.schoolId,
      fullAccess: profile.fullAccess || false,
      enabledTabs: profile.enabledTabs || []
    };
   
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}
// Middleware to require admin access
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const isAdmin = 
    req.user.isAdmin === true || 
    req.user.role === 'admin' || 
    req.user.role === 'super_admin';

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
}

// Middleware to require super admin access
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required'
    });
  }
  next();
}

// Middleware to require school access
function requireSchoolAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  // Admin and super admin have access to all schools
  if (req.user.isAdmin || req.user.role === 'admin' || req.user.role === 'super_admin') {
    return next();
  }
  
  // Regular users need a school ID
  if (!req.user.schoolId) {
    return res.status(403).json({
      success: false,
      error: 'School access required'
    });
  }
  
  // Check if user has access to the requested school
  const requestedSchoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
  
  if (requestedSchoolId && requestedSchoolId !== req.user.schoolId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied for this school'
    });
  }
  
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  requireSchoolAccess
};