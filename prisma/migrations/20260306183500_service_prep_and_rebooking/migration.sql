-- Add Service prep instructions + rebooking
ALTER TABLE "Service" ADD COLUMN "prepInstructions" TEXT;
ALTER TABLE "Service" ADD COLUMN "rebookingWeeks" INTEGER NOT NULL DEFAULT 3;
