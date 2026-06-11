import { NextRequest } from "next/server";

import { requireCompanyUser, requireRole } from "@/lib/session";
import {
  listPurchaseOrders,
  createPurchaseOrder,
} from "@/lib/actions/purchase-orders";
import { apiSuccess, apiCreated } from "@/lib/api-response";
import { poErrorResponse } from "./_helpers";

// ── List purchase orders (any company role) ────────────────────────────────
export async function GET() {
  try {
    const user = await requireCompanyUser();
    return apiSuccess(await listPurchaseOrders(user.companyId));
  } catch (error) {
    return poErrorResponse(error);
  }
}

// ── Create a purchase order (ADMIN / MANAGER) ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN", "MANAGER");
    const body = await req.json();
    const po = await createPurchaseOrder({
      companyId: user.companyId,
      userId: user.id,
      input: body,
    });
    return apiCreated(po);
  } catch (error) {
    return poErrorResponse(error);
  }
}
