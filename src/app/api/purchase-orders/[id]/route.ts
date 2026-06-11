import { NextRequest } from "next/server";

import { requireCompanyUser, requireRole } from "@/lib/session";
import {
  getPurchaseOrder,
  updatePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
} from "@/lib/actions/purchase-orders";
import { apiSuccess, apiNotFound } from "@/lib/api-response";
import { poErrorResponse } from "../_helpers";

// ── Get one purchase order (any company role) ──────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireCompanyUser();
    const po = await getPurchaseOrder(user.companyId, id);
    if (!po) return apiNotFound("Purchase order not found");
    return apiSuccess(po);
  } catch (error) {
    return poErrorResponse(error);
  }
}

// ── Edit a PO, or cancel it (ADMIN / MANAGER) ──────────────────────────────
// Body `{ cancel: true }` cancels; otherwise the body is treated as an edit.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const body = await req.json();

    if (body?.cancel === true) {
      const po = await cancelPurchaseOrder({ companyId: user.companyId, id });
      return apiSuccess(po);
    }

    const po = await updatePurchaseOrder({
      companyId: user.companyId,
      id,
      input: body,
    });
    return apiSuccess(po);
  } catch (error) {
    return poErrorResponse(error);
  }
}

// ── Delete a PO (ADMIN / MANAGER, only before any receipt) ─────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const result = await deletePurchaseOrder({ companyId: user.companyId, id });
    return apiSuccess(result);
  } catch (error) {
    return poErrorResponse(error);
  }
}
