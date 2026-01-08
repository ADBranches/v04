// frontend/js/services/moderation-service.js
import { api } from './api.js';
import AuthService from './auth-service.js';

class ModerationService {
  /**
   * Submit content for moderation
   */
  async submitContent(content_type, content_id) {
    const response = await api.post('/moderation/submit', { content_type, content_id }, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get pending content for moderation (alias for getContentQueue)
   */
  async getPendingContent(params = {}) {
    const response = await api.get('/moderation/pending', {
      params,
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get moderation queue (alias for getPendingContent)
   */
  async getContentQueue(params = {}) {
    // Use the same endpoint as getPendingContent for compatibility
    return this.getPendingContent(params);
  }

  /**
   * Get specific moderation request details
   */
  async getModerationRequest(id) {
    const response = await api.get(`/moderation/${id}`, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Approve content with optional notes
   */
  async approveContent(id, notes = '') {
    const response = await api.post(`/moderation/${id}/approve`, { notes }, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Reject content with reason
   */
  async rejectContent(id, reason) {
    const response = await api.post(`/moderation/${id}/reject`, { reason }, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get moderation statistics
   */
  async getStats() {
    const response = await api.get('/moderation/stats', {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get moderation history for a specific content item
   */
  async getContentHistory(content_type, content_id) {
    const response = await api.get(`/moderation/history/${content_type}/${content_id}`, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Get user's moderation submissions
   */
  async getUserSubmissions(user_id, params = {}) {
    const response = await api.get(`/moderation/user/${user_id}/submissions`, {
      params,
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }
}

export default new ModerationService();
