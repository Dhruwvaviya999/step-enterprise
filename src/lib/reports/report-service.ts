import type { DateWindow } from "./date-range";
import {
  getStockAndLowStock,
  getSalesReport,
  getPurchaseReport,
  type StockReport,
  type SalesReport,
  type PurchaseReport,
  type LowStockRow,
} from "./report-queries";

export type {
  StockReport,
  SalesReport,
  PurchaseReport,
  LowStockRow,
  NamedQty,
  NamedSale,
  TrendPoint,
} from "./report-queries";

export interface ReportSummary {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  totalSalesAmount: number;
  totalPurchaseQty: number;
}

export interface ReportData {
  range: { key: string; from: string; to: string };
  summary: ReportSummary;
  stock: StockReport;
  lowStock: LowStockRow[];
  sales: SalesReport;
  purchase: PurchaseReport;
}

/**
 * Single entry point the reports page calls. Runs all company-scoped report
 * queries in parallel for the given window and assembles the summary. Export
 * helpers (CSV/PDF) can later be layered on top of this same ReportData shape.
 */
export async function getReportData(
  companyId: string,
  window: DateWindow,
): Promise<ReportData> {
  const [{ stock, lowStock }, sales, purchase] = await Promise.all([
    getStockAndLowStock(companyId),
    getSalesReport(companyId, window),
    getPurchaseReport(companyId, window),
  ]);

  return {
    range: {
      key: window.key,
      from: window.from.toISOString(),
      to: window.to.toISOString(),
    },
    summary: {
      totalProducts: stock.totalProducts,
      totalStock: stock.totalQty,
      lowStockCount: lowStock.length,
      totalSalesAmount: sales.totalAmount,
      totalPurchaseQty: purchase.totalQty,
    },
    stock,
    lowStock,
    sales,
    purchase,
  };
}
