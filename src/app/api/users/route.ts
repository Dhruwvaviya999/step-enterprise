import { NextRequest } from "next/server";

import { requireRole } from "@/lib/session";
import { listUsers, createUser } from "@/lib/actions/users";
import { apiSuccess, apiCreated } from "@/lib/api-response";
import { userErrorResponse } from "./_helpers";

// ── List company users (ADMIN only) ────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireRole("ADMIN");
    return apiSuccess(await listUsers(user.companyId));
  } catch (error) {
    return userErrorResponse(error);
  }
}

// ── Create a company user (ADMIN only) ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await req.json();
    const user = await createUser({ companyId: admin.companyId, input: body });
    return apiCreated(user);
  } catch (error) {
    return userErrorResponse(error);
  }
}
