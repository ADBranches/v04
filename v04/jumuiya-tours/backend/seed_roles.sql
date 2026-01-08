-- ──────────────────────────────────────────────────────────────
-- 🌍 Jumuiya Tours Production Bootstrap Script
-- Sets up core user roles, guide verification, and sample destinations.
-- Run: psql -h localhost -U jumuiya_user -d jumuiya_tours -f seed_roles.sql
-- ──────────────────────────────────────────────────────────────

BEGIN;

-- 1️⃣  Clean duplicates if you’ve re-run registration tests
DELETE FROM "Destination";
DELETE FROM "GuideVerification";

-- 2️⃣  Update core roles
UPDATE "User" SET role = 'admin'   WHERE email = 'admin@jumuiya.com';
UPDATE "User" SET role = 'auditor' WHERE email = 'auditor@jumuiya.com';
UPDATE "User" SET role = 'guide'   WHERE email = 'guide@jumuiya.com';
UPDATE "User" SET role = 'user'    WHERE email = 'user@jumuiya.com';
UPDATE "User" SET role = 'user'    WHERE email = 'test@jumuiya.com';

-- 3️⃣  Mark the guide as verified and active
UPDATE "User"
SET guide_status = 'verified',
    is_active = TRUE,
    verified_at = NOW()
WHERE role = 'guide';

-- 4️⃣  Insert a few verified destinations (for homepage & testing)
INSERT INTO "Destination" (name, region, difficulty, featured, created_by, created_at, updated_at)
VALUES
('Murchison Falls National Park', 'Northern', 'Medium', TRUE, 4, NOW(), NOW()),
('Queen Elizabeth National Park', 'Western', 'Easy', TRUE, 4, NOW(), NOW()),
('Mount Rwenzori National Park', 'Western', 'Hard', FALSE, 4, NOW(), NOW()),
('Kidepo Valley National Park', 'Karamoja', 'Medium', TRUE, 4, NOW(), NOW()),
('Bwindi Impenetrable Forest', 'South-Western', 'Hard', TRUE, 4, NOW(), NOW());

-- 5️⃣  Add a record to GuideVerification table (to link guide status)
INSERT INTO "GuideVerification" (user_id, verified_by, status, verified_at, notes)
VALUES
((SELECT id FROM "User" WHERE email='guide@jumuiya.com'),
 (SELECT id FROM "User" WHERE email='admin@jumuiya.com'),
 'approved',
 NOW(),
 'Guide manually verified by admin seed script.');

-- 6️⃣  Optional: Add AuditLog entry for traceability
INSERT INTO "AuditLog" (user_id, type, title, message, data, created_at)
VALUES
((SELECT id FROM "User" WHERE email='admin@jumuiya.com'),
 'system',
 'Seed Initialization',
 'Production roles and destinations were seeded successfully.',
 '{}',
 NOW());

COMMIT;

-- ──────────────────────────────────────────────────────────────
-- ✅ Verification Queries (auto-prints after commit)
-- ──────────────────────────────────────────────────────────────
SELECT '✅ Users:' AS section;
TABLE "User";

SELECT '✅ Destinations:' AS section;
SELECT id, name, region, difficulty, featured, created_by FROM "Destination";

SELECT '✅ Guide Verifications:' AS section;
TABLE "GuideVerification";

SELECT '✅ Audit Log Entries:' AS section;
SELECT id, title, message, created_at FROM "AuditLog" ORDER BY id DESC LIMIT 5;

