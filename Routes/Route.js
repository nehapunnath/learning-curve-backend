// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const AuthController = require('../Controller/AuthController');
const EnquiryController = require('../Controller/EnquiryController');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../Middleware/AuthMiddleware');

// ====================== PUBLIC ROUTES ======================

// Auth Routes
router.post('/login', AuthController.login);
router.post('/verify-token', AuthController.verifyToken);
router.post('/logout', AuthController.logout);
router.post('/verify', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Enquiry Routes (Public)
router.post('/enquiries', EnquiryController.createEnquiry);

// ====================== PROTECTED ROUTES ======================

// Auth Protected
router.get('/profile', requireAuth, AuthController.getProfile);
router.patch('/profile', requireAuth, AuthController.updateProfile);

// Admin Protected
router.get('/enquiries', requireAuth,  EnquiryController.getEnquiries);
router.get('/enquiries/:id', requireAuth,  EnquiryController.getEnquiry);
router.patch('/enquiries/:id/status', requireAuth, EnquiryController.updateStatus);
router.delete('/enquiries/:id', requireAuth, EnquiryController.deleteEnquiry);

// Admin Creation
router.post('/admin/create', requireAuth, requireAdmin, AuthController.createAdmin);

module.exports = router;