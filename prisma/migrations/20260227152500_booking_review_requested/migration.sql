-- Track review request to avoid duplicate SMS
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "reviewRequestedAt" TIMESTAMP(3);
