-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "checkoutSessionId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "latestRefundId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "latestTransferId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "stripePaymentMethodId" TEXT;
