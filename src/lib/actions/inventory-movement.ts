import { Prisma, type InventoryMovementType, type StockLocation } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  inventoryMovementSchema,
  type InventoryMovementInput,
} from "@/lib/validators/inventory-movement";
import { signedDelta } from "@/lib/constants/movement-types";

/**
 * Inventory Movement Engine
 * ─────────────────────────
 * The single, reusable backend entry point for every stock change. Future
 * modules (purchase receive, sales, transfers, manual adjustments) call these
 * helpers instead of touching ProductVariant quantities directly, so that:
 *   • every stock change is recorded in inventory_movements (audit trail);
 *   • the variant's shopQty/godownQty and the ledger never drift apart;
 *   • all of it happens atomically.
 *
 * `quantity` is stored as a SIGNED delta (+in / -out), so summing the ledger
 * for a variant+location reconstructs its current stock — the movement table
 * is the source of truth.
 */

// Thrown for business-rule failures (unknown variant, insufficient stock, …).
// Callers/API routes can map `statusCode` to an HTTP response.
export class InventoryError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "InventoryError";
  }
}

export interface RecordMovementArgs {
  /** From the session — never from the request body. */
  companyId: string;
  /** User performing the change (optional; null for system-generated moves). */
  createdById?: string | null;
  /** The validated/raw movement payload. */
  input: InventoryMovementInput;
}

export interface MovementResult {
  movementId: string;
  variantId: string;
  movementType: InventoryMovementType;
  location: StockLocation;
  /** The signed delta applied to stock. */
  appliedQuantity: number;
  previousQuantity: number;
  newQuantity: number;
}

// Core routine — always runs against a transaction client so the variant
// update and the movement insert commit together.
async function run(
  tx: Prisma.TransactionClient,
  { companyId, createdById, input }: RecordMovementArgs,
): Promise<MovementResult> {
  const parsed = inventoryMovementSchema.safeParse(input);
  if (!parsed.success) {
    throw new InventoryError(
      parsed.error.issues[0]?.message ?? "Invalid movement data",
      422,
    );
  }
  const data = parsed.data;

  // Company scoping: the variant MUST belong to this company. Using companyId
  // in the filter prevents any cross-tenant stock change.
  const variant = await tx.productVariant.findFirst({
    where: { id: data.variantId, companyId },
    select: { id: true, shopQty: true, godownQty: true },
  });
  if (!variant) {
    throw new InventoryError("Variant not found for this company", 404);
  }

  const delta = signedDelta(data.movementType, data.quantity);
  const isShop = data.location === "SHOP";
  const previousQuantity = isShop ? variant.shopQty : variant.godownQty;
  const newQuantity = previousQuantity + delta;

  // Never let a location's stock go negative.
  if (newQuantity < 0) {
    throw new InventoryError(
      `Insufficient ${data.location} stock: have ${previousQuantity}, change ${delta}`,
      409,
    );
  }

  await tx.productVariant.update({
    where: { id: variant.id },
    data: isShop ? { shopQty: newQuantity } : { godownQty: newQuantity },
  });

  const movement = await tx.inventoryMovement.create({
    data: {
      companyId,
      variantId: data.variantId,
      movementType: data.movementType,
      quantity: delta, // signed
      location: data.location,
      note: data.note?.trim() || null,
      createdById: createdById ?? null,
      purchaseOrderItemId: data.purchaseOrderItemId ?? null,
      salesOrderItemId: data.salesOrderItemId ?? null,
      stockTransferId: data.stockTransferId ?? null,
    },
    select: { id: true },
  });

  return {
    movementId: movement.id,
    variantId: data.variantId,
    movementType: data.movementType,
    location: data.location,
    appliedQuantity: delta,
    previousQuantity,
    newQuantity,
  };
}

/**
 * Record a single stock movement (and apply it to the variant).
 *
 * Pass an existing transaction client (`tx`) to compose this inside a larger
 * operation — e.g. a purchase receive that records many movements atomically.
 * Without one, it runs in its own transaction.
 */
export function recordInventoryMovement(
  args: RecordMovementArgs,
  tx?: Prisma.TransactionClient,
): Promise<MovementResult> {
  if (tx) return run(tx, args);
  return prisma.$transaction((t) => run(t, args));
}

/**
 * Record several movements atomically (all succeed or none do). Useful for a
 * stock transfer (TRANSFER_OUT + TRANSFER_IN) or a multi-line document.
 */
export function recordInventoryMovements(
  argsList: RecordMovementArgs[],
  tx?: Prisma.TransactionClient,
): Promise<MovementResult[]> {
  const runAll = async (t: Prisma.TransactionClient) => {
    const results: MovementResult[] = [];
    for (const args of argsList) results.push(await run(t, args));
    return results;
  };
  if (tx) return runAll(tx);
  return prisma.$transaction(runAll);
}

// The read side (audit/history queries) lives in lib/actions/inventory-history.ts
// so this module stays focused on the write engine.
