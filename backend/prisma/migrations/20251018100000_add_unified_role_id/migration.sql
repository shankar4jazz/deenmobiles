-- AlterTable: Add roleId column to users table
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

-- Data Migration: Populate roleId from existing data
-- For users with system roles, match to Role records
-- Map SUPER_ADMIN to "Super Administrator" role
UPDATE "users"
SET "roleId" = (
  SELECT id FROM "roles"
  WHERE name = 'Super Administrator'
  AND "isSystemRole" = true
  LIMIT 1
)
WHERE "role" = 'SUPER_ADMIN' AND "roleId" IS NULL;

-- Map ADMIN to "Administrator" role
UPDATE "users"
SET "roleId" = (
  SELECT id FROM "roles"
  WHERE name = 'Administrator'
  AND "isSystemRole" = true
  LIMIT 1
)
WHERE "role" = 'ADMIN' AND "roleId" IS NULL;

-- Map MANAGER to "Branch Manager" role
UPDATE "users"
SET "roleId" = (
  SELECT id FROM "roles"
  WHERE name = 'Branch Manager'
  AND "isSystemRole" = true
  LIMIT 1
)
WHERE "role" = 'MANAGER' AND "roleId" IS NULL;

-- Map TECHNICIAN to "Technician" role
UPDATE "users"
SET "roleId" = (
  SELECT id FROM "roles"
  WHERE name = 'Technician'
  AND "isSystemRole" = true
  LIMIT 1
)
WHERE "role" = 'TECHNICIAN' AND "roleId" IS NULL;

-- Map RECEPTIONIST to "Receptionist" role
UPDATE "users"
SET "roleId" = (
  SELECT id FROM "roles"
  WHERE name = 'Receptionist'
  AND "isSystemRole" = true
  LIMIT 1
)
WHERE "role" = 'RECEPTIONIST' AND "roleId" IS NULL;

-- CreateIndex: Add index on roleId
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- AddForeignKey: Add foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
