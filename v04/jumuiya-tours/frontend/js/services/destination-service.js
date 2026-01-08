// frontend/js/services/destination-service.js
import { api } from './api.js';
import authService from './auth-service.js';

class DestinationService {
  /**
   * Fetch all destinations with optional filters
   * @param {Object} params - Query parameters (page, limit, region, difficulty, featured, search, sort, order)
   * @returns {Promise<Object>} API response
   */
  async getDestinations(params = {}) {
    try {
      // Ensure featured parameter is properly handled
      const queryParams = {
        ...params,
        // Convert boolean to string if needed for API compatibility
        featured: params.featured !== undefined ? Boolean(params.featured) : undefined,
        region: params.region || undefined,
        district: params.district || undefined
      };

      const response = await api.get('/destinations', {
        params: queryParams,
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching destinations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch a single destination by ID
   * @param {number} id - Destination ID
   * @returns {Promise<Object>} API response
   */
  async getDestination(id) {
    try {
      const response = await api.get(`/destinations/${id}`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching destination ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new destination
   * @param {Object} data - Destination data
   * @returns {Promise<Object>} API response
   */
  async createDestination(data) {
    try {
      const response = await api.post('/destinations', data, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating destination:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing destination
   * @param {number} id - Destination ID
   * @param {Object} data - Updated destination data
   * @returns {Promise<Object>} API response
   */
  async updateDestination(id, data) {
    try {
      const response = await api.put(`/destinations/${id}`, data, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating destination ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Submit a destination for approval
   * @param {number} id - Destination ID
   * @returns {Promise<Object>} API response
   */
  async submitDestination(id) {
    try {
      const response = await api.post(`/destinations/${id}/submit`, {}, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error submitting destination ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a destination
   * @param {number} id - Destination ID
   * @returns {Promise<Object>} API response
   */
  async deleteDestination(id) {
    try {
      const response = await api.delete(`/destinations/${id}`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting destination ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch pending destinations (Admin/Auditor only)
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} API response
   */
  async getPendingDestinations(params = {}) {
    try {
      const response = await api.get('/destinations/admin/pending', {
        params,
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending destinations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Approve a destination (Admin/Auditor only)
   * @param {number} id - Destination ID
   * @param {string} notes - Approval notes
   * @returns {Promise<Object>} API response
   */
  async approveDestination(id, notes = '') {
    try {
      const response = await api.post(`/destinations/${id}/approve`, { notes }, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error approving destination ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Reject a destination (Admin/Auditor only)
   * @param {number} id - Destination ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} API response
   */
  async rejectDestination(id, reason) {
    try {
      const response = await api.post(`/destinations/${id}/reject`, { reason }, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting destination ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Feature a destination (Admin/Auditor only)
   * @param {number} id - Destination ID
   * @returns {Promise<Object>} API response
   */
  async featureDestination(id) {
    try {
      const response = await api.post(`/destinations/${id}/feature`, {}, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error featuring destination ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Unfeature a destination (Admin/Auditor only)
   * @param {number} id - Destination ID
   * @returns {Promise<Object>} API response
   */
  async unfeatureDestination(id) {
    try {
      const response = await api.post(`/destinations/${id}/unfeature`, {}, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error unfeaturing destination ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param {Object} error - Error object from API call
   * @returns {Object} Formatted error object
   */
  handleError(error) {
    const errorResponse = {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
    };

    if (error.response) {
      errorResponse.message = error.response.data.error || errorResponse.message;
      errorResponse.code = error.response.data.code || errorResponse.code;
      if (error.response.status === 401) {
        authService.logout();
        router.navigate('/auth/login');
      }
    }

    return errorResponse;
  }

  /**
   * Get available regions and districts for filtering
   * @returns {Promise<Object>} Available filters
   */
  async getAvailableFilters() {
    try {
      const response = await api.get('/destinations', {
        params: { limit: 1 }, // Minimal data, we just need the filters from response
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      
      // Extract available filters from the response
      return response.data.filters?.available || {
        regions: [],
        difficulties: [],
        price_ranges: []
      };
    } catch (error) {
      console.error('Error fetching available filters:', error);
      // Return default structure if API call fails
      return {
        regions: ['Central', 'Northern', 'Western', 'Eastern'],
        difficulties: ['Easy', 'Moderate', 'Challenging'],
        price_ranges: []
      };
    }
  }

  /**
   * Get destinations filtered by specific region
   * @param {string} region - Region to filter by
   * @param {Object} additionalParams - Additional query parameters
   * @returns {Promise<Object>} API response
   */
  async getDestinationsByRegion(region, additionalParams = {}) {
    try {
      const queryParams = {
        ...additionalParams,
        region: region
      };

      const response = await api.get('/destinations', {
        params: queryParams,
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching destinations for region ${region}:`, error);
      throw this.handleError(error);
    }
}
}

export default new DestinationService();
