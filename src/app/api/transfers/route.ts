import { NextRequest } from "next/server";

import { requireCompanyUser, requireRole } from "@/lib/session";
import { listTransfers, createTransfer } from "@/lib/actions/transfers";
import { apiSuccess, apiCreated } from "@/lib/api-response";
import { transferErrorResponse } from "./_helpers";

// ── List stock transfers (any company role) ────────────────────────────────
export async function GET() {
  try {
    const user = await requireCompanyUser();
    return apiSuccess(await listTransfers(user.companyId));
  } catch (error) {
    return transferErrorResponse(error);
  }
}

// ── Create a stock transfer (ADMIN / MANAGER) ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN", "MANAGER");
    const body = await req.json();
    const transfer = await createTransfer({
      companyId: user.companyId,
      userId: user.id,
      input: body,
    });
    return apiCreated(transfer);
  } catch (error) {
    return transferErrorResponse(error);
  }
}
