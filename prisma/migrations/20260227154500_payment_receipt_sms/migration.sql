-- Track receipt SMS sent for a payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "receiptSmsSentAt" TIMESTAMP(3);
