-- Track receipt SMS sent for a payment
ALTER TABLE "Payment" ADD COLUMN "receiptSmsSentAt" DATETIME;
