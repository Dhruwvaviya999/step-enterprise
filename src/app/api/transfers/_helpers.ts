import { Prisma } from "@prisma/client";

import { AuthError } from "@/lib/session";
import { TransferError } from "@/lib/actions/transfers";
import { InventoryError } from "@/lib/actions/inventory-movement";
import { apiError, apiCatch } from "@/lib/api-response";

// Shared error mapping for every transfer route.
export function transferErrorResponse(error: unknown) {
  if (error instanceof AuthError) return apiError(error.message, error.statusCode);
  if (error instanceof TransferError)
    return apiError(error.message, error.statusCode);
  if (error instanceof InventoryError)
    return apiError(error.message, error.statusCode);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return apiError("A transfer with this number already exists", 409);
  }
  return apiCatch(error);
}
