// backend/controllers/booking-controller.js
const { PrismaClient } = require('@prisma/client');
const Booking = require('../models/Booking');

const prisma = new PrismaClient();

class BookingController {
  static async createBooking(req, res) {
    try {
      const { destination_id, booking_date, notes } = req.body;
      await Booking.validateBooking({ destination_id, booking_date, user_id: req.user.id });
      const destination = await prisma.destination.findUnique({
        where: { id: parseInt(destination_id) },
        include: { creator: true },
      });
      if (!destination) {
        return res.status(404).json({ error: 'Destination not found', code: 'NOT_FOUND' });
      }
      if (!destination.featured) {
        return res.status(400).json({ error: 'Destination is not approved for booking', code: 'NOT_APPROVED' });
      }
      const booking = await prisma.booking.create({
        data: {
          user_id: req.user.id,
          destination_id: parseInt(destination_id),
          guide_id: destination.created_by,
          booking_date: new Date(booking_date),
          notes,
          status: 'pending',
        },
        include: {
          user: { select: { name: true, email: true } },
          destination: { select: { name: true, region: true } },
          guide: { select: { name: true, email: true } },
        },
      });
      res.status(201).json({ booking });
    } catch (error) {
      res.status(error.message ? 400 : 500).json({ error: error.message || 'Internal server error', code: error.message ? 'INVALID_DATA' : 'INTERNAL_ERROR' });
    }
  }

  static async getBookings(req, res) {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    try {
      const where = {};
      if (req.user.role === 'user') {
        where.user_id = req.user.id;
      } else if (req.user.role === 'guide') {
        where.guide_id = req.user.id;
      }
      if (status) where.status = status;
      const bookings = await prisma.booking.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: { select: { name: true, email: true } },
          destination: { select: { name: true, region: true } },
          guide: { select: { name: true, email: true } },
        },
        orderBy: { created_at: 'desc' },
      });
      const total = await prisma.booking.count({ where });
      res.json({
        bookings,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getBooking(req, res) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          user: { select: { name: true, email: true } },
          destination: { select: { name: true, region: true, description: true, price_range: true } },
          guide: { select: { name: true, email: true } },
        },
      });
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found', code: 'NOT_FOUND' });
      }
      if (req.user.role === 'user' && booking.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized access', code: 'UNAUTHORIZED' });
      }
      if (req.user.role === 'guide' && booking.guide_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized access', code: 'UNAUTHORIZED' });
      }
      res.json({ booking });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async confirmBooking(req, res) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(req.params.id) },
      });
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found', code: 'NOT_FOUND' });
      }
      if (booking.guide_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the assigned guide can confirm', code: 'UNAUTHORIZED' });
      }
      if (booking.status !== 'pending') {
        return res.status(400).json({ error: 'Booking is not pending', code: 'INVALID_STATUS' });
      }
      const updatedBooking = await prisma.booking.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'confirmed' },
        include: {
          user: { select: { name: true, email: true } },
          destination: { select: { name: true, region: true } },
          guide: { select: { name: true, email: true } },
        },
      });
      res.json({ booking: updatedBooking });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async cancelBooking(req, res) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(req.params.id) },
      });
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found', code: 'NOT_FOUND' });
      }
      if (req.user.role === 'user' && booking.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the booking owner can cancel', code: 'UNAUTHORIZED' });
      }
      if (req.user.role === 'guide' && booking.guide_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the assigned guide can cancel', code: 'UNAUTHORIZED' });
      }
      if (booking.status === 'cancelled') {
        return res.status(400).json({ error: 'Booking is already cancelled', code: 'INVALID_STATUS' });
      }
      const updatedBooking = await prisma.booking.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'cancelled' },
        include: {
          user: { select: { name: true, email: true } },
          destination: { select: { name: true, region: true } },
          guide: { select: { name: true, email: true } },
        },
      });
      res.json({ booking: updatedBooking });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async updateBooking(req, res) {
    try {
      const { notes } = req.body;
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(req.params.id) },
      });
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found', code: 'NOT_FOUND' });
      }
      const updatedBooking = await prisma.booking.update({
        where: { id: parseInt(req.params.id) },
        data: { notes },
        include: {
          user: { select: { name: true, email: true } },
          destination: { select: { name: true, region: true } },
          guide: { select: { name: true, email: true } },
        },
      });
      res.json({ booking: updatedBooking });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}

module.exports = BookingController;