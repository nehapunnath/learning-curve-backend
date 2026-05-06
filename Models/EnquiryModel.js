// models/EnquiryModel.js
const { rtdb } = require('../Config/FirebaseAdmin');

class EnquiryModel {

  // Create new enquiry
  static async createEnquiry(enquiryData) {
    try {
      const enquiryId = `enq_${Date.now()}`;
      const now = new Date().toISOString();

      const enquiry = {
        enquiryId,
        parentName: enquiryData.name,
        studentName: enquiryData.studentName,
        studentClass: enquiryData.studentClass,
        mobile: enquiryData.mobile,
        email: enquiryData.email || '',
        place: enquiryData.place,
        message: enquiryData.message || '',
        acceptTerms: enquiryData.acceptTerms || false,
        acceptNewsletter: enquiryData.acceptNewsletter || false,
        status: 'new',           // new, contacted, closed
        createdAt: now,
        updatedAt: now
      };

      await rtdb.ref(`enquiries/${enquiryId}`).set(enquiry);

      return {
        success: true,
        enquiryId,
        enquiry
      };
    } catch (error) {
      console.error('Create enquiry error:', error);
      throw error;
    }
  }

  // Get all enquiries (with optional filters)
  static async getAllEnquiries({ limit = 50, status = null, place = null } = {}) {
    try {
      const snapshot = await rtdb.ref('enquiries').once('value');
      let enquiries = [];

      snapshot.forEach((child) => {
        enquiries.push(child.val());
      });

      // Sort by newest first
      enquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply filters
      if (status) {
        enquiries = enquiries.filter(e => e.status === status);
      }
      if (place) {
        enquiries = enquiries.filter(e => e.place === place);
      }

      // Limit results
      enquiries = enquiries.slice(0, limit);

      return {
        success: true,
        count: enquiries.length,
        enquiries
      };
    } catch (error) {
      console.error('Get enquiries error:', error);
      throw error;
    }
  }

  // Get single enquiry by ID
  static async getEnquiryById(enquiryId) {
    try {
      const snapshot = await rtdb.ref(`enquiries/${enquiryId}`).once('value');
      const enquiry = snapshot.val();

      if (!enquiry) {
        return { success: false, error: 'Enquiry not found' };
      }

      return { success: true, enquiry };
    } catch (error) {
      console.error('Get enquiry error:', error);
      throw error;
    }
  }

  // Update enquiry status
  static async updateEnquiryStatus(enquiryId, status) {
    try {
      await rtdb.ref(`enquiries/${enquiryId}`).update({
        status,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Update enquiry status error:', error);
      throw error;
    }
  }

  // Delete enquiry
  static async deleteEnquiry(enquiryId) {
    try {
      await rtdb.ref(`enquiries/${enquiryId}`).remove();
      return { success: true };
    } catch (error) {
      console.error('Delete enquiry error:', error);
      throw error;
    }
  }
}

module.exports = EnquiryModel;