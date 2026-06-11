import { Prisma } from "@prisma/client";

import { AuthError } from "@/lib/session";
import { POError } from "@/lib/actions/purchase-orders";
import { InventoryError } from "@/lib/actions/inventory-movement";
import { apiError, apiCatch } from "@/lib/api-response";

// Shared error mapping for every purchase-order route: turns the domain error
// classes (and a duplicate-orderNo collision) into the right HTTP response.
export function poErrorResponse(error: unknown) {
  if (error instanceof AuthError) return apiError(error.message, error.statusCode);
  if (error instanceof POError) return apiError(error.message, error.statusCode);
  if (error instanceof InventoryError)
    return apiError(error.message, error.statusCode);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return apiError("A purchase order with this number already exists", 409);
  }
  return apiCatch(error);
}
