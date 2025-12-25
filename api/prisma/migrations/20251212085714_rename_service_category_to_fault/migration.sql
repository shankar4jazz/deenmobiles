-- Rename service_categories table to faults
ALTER TABLE "service_categories" RENAME TO "faults";

-- Rename the serviceCategoryId column to faultId in technician_skills
ALTER TABLE "technician_skills" RENAME COLUMN "serviceCategoryId" TO "faultId";

-- Update the unique constraint on technician_skills
ALTER TABLE "technician_skills" DROP CONSTRAINT IF EXISTS "technician_skills_technicianProfileId_serviceCategoryId_key";
ALTER TABLE "technician_skills" ADD CONSTRAINT "technician_skills_technicianProfileId_faultId_key" UNIQUE ("technicianProfileId", "faultId");

-- Drop old index and create new one
DROP INDEX IF EXISTS "technician_skills_serviceCategoryId_idx";
CREATE INDEX "technician_skills_faultId_idx" ON "technician_skills"("faultId");

-- Create the fault_on_services junction table for many-to-many relationship
CREATE TABLE "fault_on_services" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "faultId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fault_on_services_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for serviceId-faultId combination
CREATE UNIQUE INDEX "fault_on_services_serviceId_faultId_key" ON "fault_on_services"("serviceId", "faultId");

-- Create indexes
CREATE INDEX "fault_on_services_serviceId_idx" ON "fault_on_services"("serviceId");
CREATE INDEX "fault_on_services_faultId_idx" ON "fault_on_services"("faultId");

-- Add foreign keys
ALTER TABLE "fault_on_services" ADD CONSTRAINT "fault_on_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fault_on_services" ADD CONSTRAINT "fault_on_services_faultId_fkey" FOREIGN KEY ("faultId") REFERENCES "faults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing serviceCategoryId data from services to fault_on_services
INSERT INTO "fault_on_services" ("id", "serviceId", "faultId", "createdAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "serviceCategoryId",
    CURRENT_TIMESTAMP
FROM "services"
WHERE "serviceCategoryId" IS NOT NULL;

-- Now we can drop the serviceCategoryId column from services
ALTER TABLE "services" DROP COLUMN IF EXISTS "serviceCategoryId";

-- Update foreign key in technician_skills to reference faults instead of service_categories
ALTER TABLE "technician_skills" DROP CONSTRAINT IF EXISTS "technician_skills_serviceCategoryId_fkey";
ALTER TABLE "technician_skills" ADD CONSTRAINT "technician_skills_faultId_fkey" FOREIGN KEY ("faultId") REFERENCES "faults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
