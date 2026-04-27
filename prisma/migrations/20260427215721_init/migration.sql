-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('pending_group', 'confirmed');

-- CreateTable
CREATE TABLE "Adventure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "min_people" INTEGER NOT NULL,
    "max_people" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adventure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "adventure_id" TEXT NOT NULL,
    "people_count" INTEGER NOT NULL,
    "price_per_person" INTEGER NOT NULL,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "adventure_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'pending_group',
    "share_token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_adventure_id_people_count_key" ON "Pricing"("adventure_id", "people_count");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_share_token_key" ON "Reservation"("share_token");

-- AddForeignKey
ALTER TABLE "Pricing" ADD CONSTRAINT "Pricing_adventure_id_fkey" FOREIGN KEY ("adventure_id") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_adventure_id_fkey" FOREIGN KEY ("adventure_id") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
