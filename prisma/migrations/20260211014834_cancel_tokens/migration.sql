-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "customerCancelToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_customerCancelToken_key" ON "Booking"("customerCancelToken");

