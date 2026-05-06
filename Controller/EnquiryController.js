// controllers/EnquiryController.js
const EnquiryModel = require('../Models/EnquiryModel');

class EnquiryController {

  // POST - Submit Enquiry
  static async createEnquiry(req, res) {
    try {
      const {
        name, studentName, studentClass, mobile,
        email, place, message, acceptTerms, acceptNewsletter
      } = req.body;

      // Basic validation
      if (!name || !studentName || !studentClass || !mobile || !place) {
        return res.status(400).json({
          success: false,
          error: 'Parent name, student name, class, mobile, and location are required'
        });
      }

      const result = await EnquiryModel.createEnquiry({
        name, studentName, studentClass, mobile, email, place, message,
        acceptTerms, acceptNewsletter
      });

      return res.status(201).json({
        success: true,
        message: 'Enquiry submitted successfully!',
        enquiryId: result.enquiryId,
        data: result.enquiry
      });

    } catch (error) {
      console.error('Enquiry creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to submit enquiry. Please try again.'
      });
    }
  }

  // GET - Get all enquiries (Protected - Admin only)
  static async getEnquiries(req, res) {
    try {
      const { limit, status, place } = req.query;

      const result = await EnquiryModel.getAllEnquiries({
        limit: parseInt(limit) || 50,
        status,
        place
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch enquiries'
      });
    }
  }

  // GET - Get single enquiry
  static async getEnquiry(req, res) {
    try {
      const { id } = req.params;
      const result = await EnquiryModel.getEnquiryById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch enquiry'
      });
    }
  }

  // PATCH - Update status
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['new', 'contacted', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      await EnquiryModel.updateEnquiryStatus(id, status);

      return res.status(200).json({
        success: true,
        message: `Enquiry status updated to ${status}`
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update status'
      });
    }
  }

  // DELETE - Delete enquiry
  static async deleteEnquiry(req, res) {
    try {
      const { id } = req.params;
      await EnquiryModel.deleteEnquiry(id);

      return res.status(200).json({
        success: true,
        message: 'Enquiry deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete enquiry'
      });
    }
  }
}

module.exports = EnquiryController;