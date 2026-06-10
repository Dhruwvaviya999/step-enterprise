import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ── Response shape ─────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string,  string[]>;
}

// ── Success ────────────────────────────────────────────────────────────────
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    { status }
  );
}

// ── Created ────────────────────────────────────────────────────────────────
export function apiCreated<T>(data: T) {
  return apiSuccess(data, 201);
}

// ── Error helpers ──────────────────────────────────────────────────────────
export function apiError(message: string, status = 500) {
  return NextResponse.json<ApiResponse>(
    { success: false, message },
    { status }
  );
}

export function apiNotFound(message = "Resource not found") {
  return apiError(message, 404);
}

export function apiForbidden(message = "Access denied") {
  return apiError(message, 403);
}

export function apiUnauthorized(message = "Unauthorized") {
  return apiError(message, 401);
}

export function apiBadRequest(message: string) {
  return apiError(message, 400);
}

// ── Zod validation error ───────────────────────────────────────────────────
export function apiValidationError(error: ZodError) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      message: "Validation failed",
      errors: error.flatten().fieldErrors as Record<string, string[]>,
    },
    { status: 422 }
  );
}

// ── Generic catch handler ──────────────────────────────────────────────────
export function apiCatch(error: unknown) {
  if (error instanceof ZodError) return apiValidationError(error);

  console.error("[API Error]", error);
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return apiError(message, 500);
}