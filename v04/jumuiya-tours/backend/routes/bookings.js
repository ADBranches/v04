// routes/bookings.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission, checkOwnership } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-middleware.js';

const prisma = new PrismaClient();
const router = express.Router();

// Create a booking (Users only)
router.post('/', 
  authenticateToken,
  requireRole(['user']),
  async (req, res) => {
    try {
      const { destination_id, booking_date, number_of_people, special_requests } = req.body;
      const userId = req.user.id;

      if (!destination_id || !booking_date || !number_of_people) {
        return res.status(400).json({ 
          success: false,
          error: 'Destination, booking date, and number of people are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Verify destination exists and is approved
      const destination = await prisma.destination.findFirst({
        where: { 
          id: parseInt(destination_id),
          status: 'approved'
        },
        select: {
          id: true,
          name: true,
          price_range: true,
          created_by: true
        }
      });

      if (!destination) {
        return res.status(404).json({ 
          success: false,
          error: 'Destination not available for booking',
          code: 'DESTINATION_NOT_AVAILABLE'
        });
      }

      // Calculate total amount (simplified - you can enhance this with proper pricing logic)
      const basePrice = 50000; // UGX 50,000 base price
      const totalAmount = basePrice * parseInt(number_of_people);

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          user_id: userId,
          destination_id: parseInt(destination_id),
          guide_id: destination.created_by, // Assign to destination creator (guide)
          booking_date: new Date(booking_date),
          number_of_people: parseInt(number_of_people),
          total_amount: totalAmount,
          currency: 'UGX',
          special_requests: special_requests || null,
          status: 'pending',
          payment_status: 'pending'
        },
        include: {
          destination: {
            select: {
              name: true,
              location: true,
              images: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Create notification for the guide
      try {
        await prisma.notification.create({
          data: {
            user_id: destination.created_by,
            type: 'booking',
            title: 'New Booking Request',
            message: `You have a new booking request for ${destination.name} from ${req.user.name}`,
            priority: 'normal',
            data: JSON.stringify({
              booking_id: booking.id,
              destination_name: destination.name,
              customer_name: req.user.name,
              booking_date: booking_date
            }),
            action_url: `/bookings/${booking.id}`
          }
        });
      } catch (notificationError) {
        console.log('Notification creation failed:', notificationError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: booking
      });

    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create booking',
        code: 'BOOKING_CREATION_ERROR'
      });
    }
  }
);

// List bookings with role-based access
router.get('/', 
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      let whereClause = {};

      // Role-based filtering
      if (userRole === 'user') {
        whereClause.user_id = userId;
      } else if (userRole === 'guide') {
        whereClause.guide_id = userId;
      }
      // Admin and auditor can see all bookings (no additional where clause)

      const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: {
          destination: {
            select: {
              name: true,
              location: true,
              images: true,
              price_range: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          },
          guide: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({
        success: true,
        bookings: bookings,
        count: bookings.length
      });

    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch bookings',
        code: 'FETCH_BOOKINGS_ERROR'
      });
    }
  }
);

// Get a single booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId },
      include: {
        destination: {
          select: {
            name: true,
            location: true,
            description: true,
            images: true,
            price_range: true,
            duration: true,
            difficulty_level: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            phone_number: true
          }
        },
        guide: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            phone_number: true,
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Check access permissions
    const canAccess =
      userRole === 'admin' ||
      userRole === 'auditor' ||
      booking.user_id === userId ||
      booking.guide_id === userId;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this booking',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      code: 'FETCH_BOOKING_ERROR'
    });
  }
});

// Confirm a booking (Guides only)
router.post('/:id/confirm', 
  authenticateToken,
  requireRole(['guide']),
  async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const guideId = req.user.id;

      const booking = await prisma.booking.findFirst({
        where: { 
          id: bookingId,
          guide_id: guideId // Ensure guide owns this booking
        }
      });

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          error: 'Booking not found or access denied',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({ 
          success: false,
          error: 'Booking cannot be confirmed in its current status',
          code: 'INVALID_BOOKING_STATUS'
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'confirmed',
          updated_at: new Date()
        },
        include: {
          destination: {
            select: { name: true }
          },
          user: {
            select: { name: true, email: true }
          }
        }
      });

      // Create notification for the user
      try {
        await prisma.notification.create({
          data: {
            user_id: booking.user_id,
            type: 'booking',
            title: 'Booking Confirmed!',
            message: `Your booking for ${updatedBooking.destination.name} has been confirmed by the guide.`,
            priority: 'normal',
            data: JSON.stringify({
              booking_id: booking.id,
              destination_name: updatedBooking.destination.name,
              guide_name: req.user.name
            }),
            action_url: `/bookings/${booking.id}`
          }
        });
      } catch (notificationError) {
        console.log('Notification creation failed:', notificationError.message);
      }

      res.json({
        success: true,
        message: 'Booking confirmed successfully',
        booking: updatedBooking
      });

    } catch (error) {
      console.error('Confirm booking error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Failed to confirm booking',
        code: 'CONFIRM_BOOKING_ERROR'
      });
    }
  }
);

// Cancel a booking (Users for their own, Guides for their bookings)
router.post('/:id/cancel', 
  authenticateToken,
  requireRole(['user', 'guide']),
  async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      const { reason } = req.body;

      // Find booking with access control
      const booking = await prisma.booking.findFirst({
        where: { 
          id: bookingId,
          OR: [
            { user_id: userId }, // User can cancel their own bookings
            { guide_id: userId } // Guide can cancel their assigned bookings
          ]
        }
      });

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          error: 'Booking not found or access denied',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({ 
          success: false,
          error: 'Booking cannot be cancelled in its current status',
          code: 'INVALID_BOOKING_STATUS'
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'cancelled',
          cancellation_reason: reason || 'No reason provided',
          cancelled_at: new Date(),
          updated_at: new Date()
        },
        include: {
          destination: {
            select: { name: true }
          },
          user: {
            select: { name: true, email: true }
          },
          guide: {
            select: { name: true, email: true }
          }
        }
      });

      // Create notification for the other party
      try {
        const notifyUserId = userRole === 'user' ? booking.guide_id : booking.user_id;
        const cancelledBy = userRole === 'user' ? 'customer' : 'guide';
        
        await prisma.notification.create({
          data: {
            user_id: notifyUserId,
            type: 'booking',
            title: 'Booking Cancelled',
            message: `A booking for ${updatedBooking.destination.name} has been cancelled by the ${cancelledBy}.`,
            priority: 'normal',
            data: JSON.stringify({
              booking_id: booking.id,
              destination_name: updatedBooking.destination.name,
              cancelled_by: cancelledBy,
              reason: reason
            }),
            action_url: `/bookings/${booking.id}`
          }
        });
      } catch (notificationError) {
        console.log('Notification creation failed:', notificationError.message);
      }

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking: updatedBooking
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Failed to cancel booking',
        code: 'CANCEL_BOOKING_ERROR'
      });
    }
  }
);

// Update booking notes (Admins only)
router.put('/:id', 
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { internal_notes, customer_notes, status } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      const updateData = {};
      if (internal_notes !== undefined) updateData.internal_notes = internal_notes;
      if (customer_notes !== undefined) updateData.customer_notes = customer_notes;
      if (status !== undefined) updateData.status = status;
      updateData.updated_at = new Date();

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          destination: {
            select: { name: true }
          },
          user: {
            select: { name: true, email: true }
          },
          guide: {
            select: { name: true, email: true }
          }
        }
      });

      res.json({
        success: true,
        message: 'Booking updated successfully',
        booking: updatedBooking
      });

    } catch (error) {
      console.error('Update booking error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Failed to update booking',
        code: 'UPDATE_BOOKING_ERROR'
      });
    }
  }
);

// Get user's bookings (convenience endpoint)
router.get('/my-bookings', 
  authenticateToken,
  requireRole(['user']),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const bookings = await prisma.booking.findMany({
        where: { user_id: userId },
        include: {
          destination: {
            select: {
              name: true,
              location: true,
              images: true,
              price_range: true
            }
          },
          guide: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({
        success: true,
        bookings: bookings,
        count: bookings.length
      });

    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch user bookings',
        code: 'FETCH_USER_BOOKINGS_ERROR'
      });
    }
  }
);

export default router;