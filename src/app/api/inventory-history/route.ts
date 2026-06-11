import { NextRequest } from "next/server";

import { requireCompanyUser, AuthError } from "@/lib/session";
import {
  buildHistoryFilter,
  getInventoryHistory,
} from "@/lib/actions/inventory-history";
import { apiSuccess, apiError, apiCatch } from "@/lib/api-response";

// ── GET inventory movement history (any company role, read-only) ───────────
// Always scoped to the session's companyId. Optional filters via query string:
//   ?type=  ?location=  ?productId=  ?q=  ?range=  ?from=  ?to=  ?page=
export async function GET(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filter = buildHistoryFilter(user.companyId, raw);
    const result = await getInventoryHistory(filter);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}
