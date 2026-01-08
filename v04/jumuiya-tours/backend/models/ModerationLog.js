// backend/models/ModerationLog.js
// const { PrismaClient } = require('@prisma/client');
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class ModerationLog {
  static async validateSubmission({ content_type, content_id, user_id }) {
    if (!content_type || !content_id) {
      throw new Error('Content type and ID are required');
    }
    if (content_type !== 'destination') {
      throw new Error('Invalid content type');
    }
    const existing = await prisma.moderationLog.findFirst({
      where: {
        content_type,
        content_id,
        status: 'pending',
      },
    });
    if (existing) {
      throw new Error('Content is already pending moderation');
    }
    const content = await prisma.destination.findUnique({ where: { id: content_id } });
    if (!content) {
      throw new Error('Content not found');
    }
    if (content.created_by !== user_id) {
      throw new Error('You can only submit your own content');
    }
    return true;
  }
}

export default ModerationLog;