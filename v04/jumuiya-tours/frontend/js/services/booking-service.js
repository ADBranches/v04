// frontend/js/services/booking-service.js
import { api } from './api.js';
import AuthService from './auth-service.js';

class BookingService {
  async createBooking(data) {
    const response = await api.post('/bookings', data, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  async getBookings(params = {}) {
    const response = await api.get('/bookings', {
      params,
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  async getBooking(id) {
    const response = await api.get(`/bookings/${id}`, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  async confirmBooking(id) {
    const response = await api.post(`/bookings/${id}/confirm`, {}, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  async cancelBooking(id) {
    const response = await api.post(`/bookings/${id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  async updateBooking(id, notes) {
    const response = await api.put(`/bookings/${id}`, { notes }, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }
}

export default new BookingService();
