import { NextRequest } from "next/server";

import { requireRole } from "@/lib/session";
import { updateUser, deleteUser } from "@/lib/actions/users";
import { apiSuccess } from "@/lib/api-response";
import { userErrorResponse } from "../_helpers";

// ── Update a company user (ADMIN only) ─────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const admin = await requireRole("ADMIN");
    const body = await req.json();
    const user = await updateUser({
      companyId: admin.companyId,
      actingUserId: admin.id,
      id,
      input: body,
    });
    return apiSuccess(user);
  } catch (error) {
    return userErrorResponse(error);
  }
}

// ── Delete a company user (ADMIN only) ─────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const admin = await requireRole("ADMIN");
    const result = await deleteUser({
      companyId: admin.companyId,
      actingUserId: admin.id,
      id,
    });
    return apiSuccess(result);
  } catch (error) {
    return userErrorResponse(error);
  }
}
