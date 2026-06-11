import { NextRequest } from "next/server";
import { InventoryMovementType, StockLocation } from "@prisma/client";

import { requireCompanyUser, AuthError } from "@/lib/session";
import { getInventoryHistory } from "@/lib/actions/inventory-movement";
import { movementTypeLabel, MOVEMENT_TYPE_META } from "@/lib/constants/movement-types";
import { apiSuccess, apiError, apiCatch } from "@/lib/api-response";

// Narrow a raw query value to a valid enum member (or undefined).
function asEnum<T extends Record<string, string>>(
  enumObj: T,
  value: string | null,
): T[keyof T] | undefined {
  if (value && value in enumObj) return enumObj[value as keyof T];
  return undefined;
}

function toInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

// ── GET inventory movement history (any company role, read-only) ───────────
// Always scoped to the session's companyId. Optional filters:
//   ?variantId=  ?productId=  ?type=PURCHASE  ?location=SHOP  ?take=  ?skip=
export async function GET(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const sp = req.nextUrl.searchParams;

    const { items, total, take, skip } = await getInventoryHistory({
      companyId: user.companyId,
      variantId: sp.get("variantId") || undefined,
      productId: sp.get("productId") || undefined,
      movementType: asEnum(InventoryMovementType, sp.get("type")),
      location: asEnum(StockLocation, sp.get("location")),
      take: toInt(sp.get("take")),
      skip: toInt(sp.get("skip")),
    });

    const data = items.map((m) => ({
      id: m.id,
      movementType: m.movementType,
      movementLabel: movementTypeLabel(m.movementType),
      direction: MOVEMENT_TYPE_META[m.movementType].direction,
      quantity: m.quantity, // signed delta
      location: m.location,
      note: m.note,
      createdAt: m.createdAt,
      createdBy: m.createdBy
        ? m.createdBy.name ?? m.createdBy.username ?? null
        : null,
      variant: {
        id: m.variant.id,
        size: m.variant.size,
        color: m.variant.color,
        articleNo: m.variant.product.articleNo,
        articleName: m.variant.product.articleName,
      },
    }));

    return apiSuccess({ items: data, total, take, skip });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}
