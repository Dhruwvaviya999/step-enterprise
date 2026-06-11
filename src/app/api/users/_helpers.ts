import { Prisma } from "@prisma/client";

import { AuthError } from "@/lib/session";
import { UserError } from "@/lib/actions/users";
import { apiError, apiCatch } from "@/lib/api-response";

// Shared error mapping for every user route.
export function userErrorResponse(error: unknown) {
  if (error instanceof AuthError) return apiError(error.message, error.statusCode);
  if (error instanceof UserError) return apiError(error.message, error.statusCode);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = String(error.meta?.target ?? "");
    if (target.includes("email"))
      return apiError("That email is already in use", 409);
    return apiError("That username is already taken", 409);
  }
  return apiCatch(error);
}
