-- CreateEnum
CREATE TYPE "GuideStatus" AS ENUM ('unverified', 'pending', 'verified', 'suspended');

-- CreateEnum
CREATE TYPE "DestinationStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "reviewed_by" INTEGER;

-- AlterTable
ALTER TABLE "GuideVerification" ADD COLUMN     "reviewed_by" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "suspended_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideVerification" ADD CONSTRAINT "GuideVerification_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
