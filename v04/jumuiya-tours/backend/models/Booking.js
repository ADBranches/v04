// backend/models/Booking.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Booking {
  static async validateBooking({ destination_id, booking_date, user_id }) {
    if (!destination_id || !booking_date) {
      throw new Error('Destination ID and booking date are required');
    }
    const destination = await prisma.destination.findUnique({
      where: { id: parseInt(destination_id) },
    });
    if (!destination) {
      throw new Error('Destination not found');
    }
    if (!destination.featured) {
      throw new Error('Destination is not approved for booking');
    }
    const parsedDate = new Date(booking_date);
    if (isNaN(parsedDate) || parsedDate < new Date()) {
      throw new Error('Invalid or past booking date');
    }
    const existingBooking = await prisma.booking.findFirst({
      where: {
        user_id,
        destination_id: parseInt(destination_id),
        status: { in: ['pending', 'confirmed'] },
      },
    });
    if (existingBooking) {
      throw new Error('You already have a pending or confirmed booking for this destination');
    }
    return true;
  }
}

module.exports = Booking;