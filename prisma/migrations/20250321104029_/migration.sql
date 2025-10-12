-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('VISA', 'MASTERCARD', 'AMERICAN_EXPRESS', 'VERVE');

-- CreateTable
CREATE TABLE "Cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "cardToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cardType" "CardType" NOT NULL,
    "currency" "Currency" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nameOnCard" TEXT NOT NULL,
    "last4Digits" TEXT NOT NULL,
    "first6Digits" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,

    CONSTRAINT "Cards_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_id_fkey" FOREIGN KEY ("id") REFERENCES "Cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cards" ADD CONSTRAINT "Cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
