import { Prisma } from "@prisma/client";

import { AuthError } from "@/lib/session";
import { SalesError } from "@/lib/actions/sales-orders";
import { InventoryError } from "@/lib/actions/inventory-movement";
import { apiError, apiCatch } from "@/lib/api-response";

// Shared error mapping for every sales-order route.
export function salesErrorResponse(error: unknown) {
  if (error instanceof AuthError) return apiError(error.message, error.statusCode);
  if (error instanceof SalesError) return apiError(error.message, error.statusCode);
  if (error instanceof InventoryError)
    return apiError(error.message, error.statusCode);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return apiError("An invoice with this number already exists", 409);
  }
  return apiCatch(error);
}
