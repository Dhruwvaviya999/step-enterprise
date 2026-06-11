import { NextRequest } from "next/server";

import { requireCompanyUser } from "@/lib/session";
import { getTransfer } from "@/lib/actions/transfers";
import { apiSuccess, apiNotFound } from "@/lib/api-response";
import { transferErrorResponse } from "../_helpers";

// ── Get one stock transfer (any company role) ──────────────────────────────
// Transfers are immutable history events, so there is no update/delete here.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireCompanyUser();
    const transfer = await getTransfer(user.companyId, id);
    if (!transfer) return apiNotFound("Transfer not found");
    return apiSuccess(transfer);
  } catch (error) {
    return transferErrorResponse(error);
  }
}
