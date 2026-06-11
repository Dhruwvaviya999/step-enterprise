import { NextRequest } from "next/server";

import { requireCompanyUser, requireRole } from "@/lib/session";
import {
  getSalesOrder,
  updateSalesOrder,
  completeSalesOrder,
  cancelSalesOrder,
  deleteSalesOrder,
} from "@/lib/actions/sales-orders";
import { apiSuccess, apiNotFound } from "@/lib/api-response";
import { salesErrorResponse } from "../_helpers";

// ── Get one sales order (any company role) ─────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireCompanyUser();
    const so = await getSalesOrder(user.companyId, id);
    if (!so) return apiNotFound("Sales order not found");
    return apiSuccess(so);
  } catch (error) {
    return salesErrorResponse(error);
  }
}

// ── Complete / cancel / edit a draft (ADMIN / MANAGER) ─────────────────────
// Body `{ complete: true }` finalises a draft, `{ cancel: true }` cancels;
// otherwise the body is treated as an edit (draft only).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const body = await req.json();

    if (body?.complete === true) {
      const so = await completeSalesOrder({
        companyId: user.companyId,
        userId: user.id,
        id,
      });
      return apiSuccess(so);
    }
    if (body?.cancel === true) {
      const so = await cancelSalesOrder({
        companyId: user.companyId,
        userId: user.id,
        id,
      });
      return apiSuccess(so);
    }

    const so = await updateSalesOrder({ companyId: user.companyId, id, input: body });
    return apiSuccess(so);
  } catch (error) {
    return salesErrorResponse(error);
  }
}

// ── Delete a draft invoice (ADMIN / MANAGER) ───────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const result = await deleteSalesOrder({ companyId: user.companyId, id });
    return apiSuccess(result);
  } catch (error) {
    return salesErrorResponse(error);
  }
}
