-- CreateEnum
CREATE TYPE "SizeType" AS ENUM ('BIG', 'SMALL');

-- DropIndex
DROP INDEX "product_variants_company_id_product_id_size_color_key";

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "size_type" "SizeType" NOT NULL DEFAULT 'BIG';

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_company_id_product_id_size_color_size_type_key" ON "product_variants"("company_id", "product_id", "size", "color", "size_type");
