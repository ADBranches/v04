// backend/controllers/admin-controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AdminController {
  static async getUsers(req, res) {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;
    try {
      const where = {};
      if (role) where.role = role;
      const users = await prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          guide_status: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      });
      const total = await prisma.user.count({ where });
      res.json({
        users,
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

  static async updateUser(req, res) {
    try {
      const { name, email, guide_status } = req.body;
      const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
      if (!user) {
        return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      }
      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot modify your own account', code: 'INVALID_ACTION' });
      }
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(req.params.id) },
        data: { name, email, guide_status },
        select: { id: true, email: true, name: true, role: true, guide_status: true },
      });
      res.json({ user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
      if (!user) {
        return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      }
      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account', code: 'INVALID_ACTION' });
      }
      await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async updateUserRole(req, res) {
    try {
      const { role } = req.body;
      if (!['user', 'guide', 'auditor', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role', code: 'INVALID_DATA' });
      }
      const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
      if (!user) {
        return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      }
      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot modify your own role', code: 'INVALID_ACTION' });
      }
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(req.params.id) },
        data: { role },
        select: { id: true, email: true, name: true, role: true },
      });
      res.json({ user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getAnalytics(req, res) {
    try {
      const userCount = await prisma.user.count();
      const bookingCount = await prisma.booking.count();
      const destinationCount = await prisma.destination.count();
      const moderationCount = await prisma.moderationLog.count({ where: { status: 'pending' } });
      const bookingsByRegion = await prisma.booking.groupBy({
        by: ['destination_id'],
        _count: { id: true },
        include: {
          destination: { select: { region: true, district: true } },
        },
      });
      const regionalStats = bookingsByRegion.reduce((acc, item) => {
        const region = item.destination.region;
        acc[region] = (acc[region] || 0) + item._count.id;
        return acc;
      }, {});
      res.json({
        analytics: {
          totalUsers: userCount,
          totalBookings: bookingCount,
          totalDestinations: destinationCount,
          pendingModerations: moderationCount,
          bookingsByRegion: regionalStats,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}

module.exports = AdminController;
