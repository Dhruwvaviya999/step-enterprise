import { NextRequest } from "next/server";

import { requireCompanyUser } from "@/lib/session";
import { listSalesOrders, createSalesOrder } from "@/lib/actions/sales-orders";
import { apiSuccess, apiCreated } from "@/lib/api-response";
import { salesErrorResponse } from "./_helpers";

// ── List sales orders (any company role) ───────────────────────────────────
export async function GET() {
  try {
    const user = await requireCompanyUser();
    return apiSuccess(await listSalesOrders(user.companyId));
  } catch (error) {
    return salesErrorResponse(error);
  }
}

// ── Create a sales order / invoice (any company role — STAFF may sell) ─────
export async function POST(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const body = await req.json();
    const so = await createSalesOrder({
      companyId: user.companyId,
      userId: user.id,
      input: body,
    });
    return apiCreated(so);
  } catch (error) {
    return salesErrorResponse(error);
  }
}
