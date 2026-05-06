// models/AuthModel.js
const { admin, rtdb } = require('../Config/FirebaseAdmin');

class AuthModel {
  
  // Authenticate user with email and password
  static async authenticateWithEmailPassword(email, password) {
    try {
      // Since Firebase Admin SDK doesn't have direct email/password sign-in,
      // we need to use the Firebase Auth REST API or create a custom token
      // For this example, we'll first get the user by email from Firebase Auth
      
      let userRecord;
      try {
        // Get user by email
        userRecord = await admin.auth().getUserByEmail(email);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          return {
            success: false,
            error: 'Invalid email or password'
          };
        }
        throw error;
      }

      // Note: Admin SDK cannot verify passwords directly.
      // For production, you should implement one of these approaches:
      // 1. Use Firebase Client SDK for login and pass ID token to backend
      // 2. Use Firebase Auth REST API to verify credentials
      // 3. Store password hash in Firestore/Realtime DB (not recommended)
      
      // For now, we'll assume the user exists and is authenticated
      // In production, you should verify the password properly
      
      // Fetch additional user data from Realtime Database
      let fullAccess = false;
      let enabledTabs = [];
      let role = null;
      let schoolId = null;
      let isAdmin = false;
      
      try {
        const profileSnapshot = await rtdb.ref(`users/${userRecord.uid}/profile`).once('value');
        const profile = profileSnapshot.val() || {};
        fullAccess = profile.fullAccess || false;
        enabledTabs = profile.enabledTabs || [];
        role = profile.role;
        schoolId = profile.schoolId;
        isAdmin = role === 'admin' || profile.isAdmin === true;
      } catch (dbError) {
        console.error('Failed to fetch user profile:', dbError);
      }

      // Get custom claims
      const claims = userRecord.customClaims || {};
      
      return {
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName || email.split('@')[0],
          isAdmin: isAdmin || claims.admin === true,
          role: role || claims.role || 'user',
          schoolId: schoolId || claims.schoolId || null,
          fullAccess: fullAccess,
          enabledTabs: enabledTabs,
          emailVerified: userRecord.emailVerified,
          createdAt: userRecord.metadata.creationTime,
          lastLogin: userRecord.metadata.lastSignInTime
        }
      };
      
    } catch (error) {
      console.error('Authentication failed:', error);
      return {
        success: false,
        error: 'Authentication failed. Please try again.'
      };
    }
  }

  // Get user profile from Realtime Database
  static async getUserProfile(uid) {
    try {
      const snapshot = await rtdb.ref(`users/${uid}/profile`).once('value');
      const profile = snapshot.val() || {};
      
      // Also get user record for claims
      const userRecord = await admin.auth().getUser(uid);
      const claims = userRecord.customClaims || {};
      
      return {
        ...profile,
        name: profile.name || userRecord.displayName,
        email: userRecord.email,
        role: profile.role || claims.role || 'user',
        schoolId: profile.schoolId || claims.schoolId,
        fullAccess: profile.fullAccess || claims.fullAccess || false,
        enabledTabs: profile.enabledTabs || [],
        isAdmin: profile.role === 'admin' || claims.admin === true
      };
    } catch (err) {
      console.error('Profile fetch error:', err);
      return {};
    }
  }

  // Update user profile
  static async updateUserProfile(uid, profileData) {
    try {
      await rtdb.ref(`users/${uid}/profile`).update(profileData);
      
      // If role or schoolId changed, update custom claims
      if (profileData.role || profileData.schoolId) {
        const currentClaims = {};
        if (profileData.role) currentClaims.role = profileData.role;
        if (profileData.schoolId) currentClaims.schoolId = profileData.schoolId;
        if (profileData.role === 'admin') currentClaims.admin = true;
        
        await admin.auth().setCustomUserClaims(uid, currentClaims);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Profile update error:', err);
      return { success: false, error: err.message };
    }
  }

  // Set admin claim for a user
  static async setAdminClaim(uid, isAdmin = true) {
    try {
      await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
      return { success: true };
    } catch (err) {
      console.error('Set custom claim error:', err);
      return { success: false, error: err.message };
    }
  }

  // Create a new admin user (super admin only)
  static async createAdminUser(email, password, name, role = 'admin') {
    try {
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: true
      });

      // Set custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        admin: role === 'super_admin',
        role: role
      });

      // Store profile in Realtime Database
      await rtdb.ref(`users/${userRecord.uid}/profile`).set({
        name: name,
        email: email,
        role: role,
        isAdmin: role === 'admin' || role === 'super_admin',
        createdAt: new Date().toISOString(),
        enabledTabs: ['dashboard', 'students', 'teachers', 'halltickets']
      });

      return {
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: name,
          role: role
        }
      };
    } catch (err) {
      console.error('Create admin error:', err);
      return { success: false, error: err.message };
    }
  }

  // Verify ID token (for existing token-based auth)
  // models/AuthModel.js - Replace the verifyIdToken method
static async verifyIdToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    
    console.log('Decoded token claims:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
      schoolId: decodedToken.schoolId,
      admin: decodedToken.admin
    });
    
    // Fetch additional user data from Realtime Database
    let fullAccess = false;
    let enabledTabs = [];
    let profileRole = null;
    let profileSchoolId = null;
    let profileName = null;
    
    try {
      const profileSnapshot = await rtdb.ref(`users/${decodedToken.uid}/profile`).once('value');
      const profile = profileSnapshot.val() || {};
      fullAccess = profile.fullAccess || false;
      enabledTabs = profile.enabledTabs || [];
      profileRole = profile.role;
      profileSchoolId = profile.schoolId;
      profileName = profile.name;
    } catch (dbError) {
      console.error('Failed to fetch user profile:', dbError);
    }

    // Determine role: Claims take precedence over profile
    const finalRole = decodedToken.role || profileRole || 'admin'; // Default to admin
    const finalSchoolId = decodedToken.schoolId || profileSchoolId || null;
    const isAdmin = decodedToken.admin === true || finalRole === 'admin' || finalRole === 'super_admin';
    const finalName = profileName || decodedToken.name || decodedToken.email?.split('@')[0] || 'Admin';

    return {
      success: true,  // Add success property
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: finalName,
      picture: decodedToken.picture || null,
      isAdmin: isAdmin,
      schoolId: finalSchoolId,
      role: finalRole,
      fullAccess: fullAccess,
      enabledTabs: enabledTabs,
      emailVerified: !!decodedToken.email_verified,
    };
  } catch (error) {
    console.error('Token verification failed:', error.code, error.message);
    return {
      success: false,  // Return object with success false
      error: error.message || 'Token verification failed'
    };
  }
}
}

module.exports = AuthModel;