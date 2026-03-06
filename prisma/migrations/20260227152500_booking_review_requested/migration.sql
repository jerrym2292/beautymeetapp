-- Track review request to avoid duplicate SMS
ALTER TABLE "Booking" ADD COLUMN "reviewRequestedAt" DATETIME;
