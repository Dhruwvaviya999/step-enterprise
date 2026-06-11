import { NextRequest } from "next/server";

import { requireRole } from "@/lib/session";
import { receivePurchaseOrderStock } from "@/lib/actions/purchase-orders";
import { apiSuccess } from "@/lib/api-response";
import { poErrorResponse } from "../../_helpers";

// ── Receive stock against a purchase order (ADMIN / MANAGER) ───────────────
// Full or partial. Each received line creates a PURCHASE InventoryMovement via
// the Step 8 engine and the PO status is recomputed (PARTIAL / RECEIVED).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const body = await req.json();
    const po = await receivePurchaseOrderStock({
      companyId: user.companyId,
      userId: user.id,
      id,
      input: body,
    });
    return apiSuccess(po);
  } catch (error) {
    return poErrorResponse(error);
  }
}
