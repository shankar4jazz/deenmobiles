-- Restructure ServiceStatus enum and add DeliveryStatus

-- Step 1: Create DeliveryStatus enum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'DELIVERED');

-- Step 2: Add deliveryStatus column to Service table
ALTER TABLE "Service" ADD COLUMN "deliveryStatus" "DeliveryStatus";

-- Step 3: Add new ServiceStatus enum values
ALTER TYPE "ServiceStatus" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "ServiceStatus" ADD VALUE IF NOT EXISTS 'NOT_READY';

-- Step 4: Migrate existing data
-- COMPLETED -> READY
UPDATE "Service" SET "status" = 'READY' WHERE "status" = 'COMPLETED';

-- NOT_SERVICEABLE -> NOT_READY
UPDATE "Service" SET "status" = 'NOT_READY' WHERE "status" = 'NOT_SERVICEABLE';

-- DELIVERED -> READY + deliveryStatus=DELIVERED
UPDATE "Service" SET "status" = 'READY', "deliveryStatus" = 'DELIVERED' WHERE "status" = 'DELIVERED';

-- CANCELLED -> Set to PENDING (or handle as needed)
UPDATE "Service" SET "status" = 'PENDING' WHERE "status" = 'CANCELLED';

-- Step 5: Set deliveryStatus to PENDING for READY/NOT_READY services that don't have it set
UPDATE "Service" SET "deliveryStatus" = 'PENDING'
WHERE "status" IN ('READY', 'NOT_READY') AND "deliveryStatus" IS NULL;

-- Note: Removing old enum values requires recreating the enum type
-- This is handled by Prisma when running prisma migrate
