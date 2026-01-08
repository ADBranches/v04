// frontend/js/services/guide-service.js
import { api } from './api.js';
import AuthService from './auth-service.js';

class GuideService {
  /**
   * Get all guides with optional filters
   */
  async getGuides(params = {}) {
    const response = await api.get('/guides', {
      params,
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get a specific guide by ID
   */
  async getGuide(id) {
    const response = await api.get(`/guides/${id}`, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get pending guide applications (for admin/auditor)
   */
  async getPendingGuides(params = {}) {
    const response = await api.get('/guides/pending', {
      params,
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Apply to become a guide
   */
  async applyAsGuide(applicationData) {
    const response = await api.post('/guides/apply', applicationData, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Submit guide verification documents
   */
  async submitVerification(guideId, documents) {
    const response = await api.post(`/guides/${guideId}/verification`, { documents }, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Verify a guide (admin/auditor only)
   */
  async verifyGuide(id, notes = '') {
    const response = await api.post(`/guides/${id}/verify`, { notes }, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Reject a guide application (admin/auditor only)
   */
  async rejectGuide(id, reason) {
    const response = await api.post(`/guides/${id}/reject`, { reason }, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Update guide profile
   */
  async updateGuideProfile(id, profileData) {
    const response = await api.put(`/guides/${id}/profile`, profileData, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get guide statistics
   */
  async getGuideStats(guideId) {
    const response = await api.get(`/guides/${guideId}/stats`, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get guide's destinations
   */
  async getGuideDestinations(guideId, params = {}) {
    const response = await api.get(`/guides/${guideId}/destinations`, {
      params,
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get guide's bookings
   */
  async getGuideBookings(guideId, params = {}) {
    const response = await api.get(`/guides/${guideId}/bookings`, {
      params,
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Search guides by location/specialization
   */
  async searchGuides(params = {}) {
    const response = await api.get('/guides/search', {
      params,
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get featured guides
   */
  async getFeaturedGuides() {
    const response = await api.get('/guides/featured', {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get guide verification status
   */
  async getVerificationStatus(guideId) {
    const response = await api.get(`/guides/${guideId}/verification-status`, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }
}

export default new GuideService();