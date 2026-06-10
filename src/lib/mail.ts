import nodemailer from "nodemailer";

// ── Transporter ────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for others
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

const FROM_ADDRESS = `"${process.env.SMTP_FROM_NAME ?? "Inventory App"}" <${process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER}>`;

// ── Base send helper ───────────────────────────────────────────────────────
interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(options: SendMailOptions) {
  return transporter.sendMail({
    from: FROM_ADDRESS,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

// ── Domain-specific helpers ────────────────────────────────────────────────

/** Notify relevant users when a product variant hits or goes below minStock */
export async function sendLowStockAlert({
  to,
  productName,
  variantInfo,
  currentStock,
  minStock,
  location,
}: {
  to: string | string[];
  productName: string;
  variantInfo: string; // e.g. "Size: M / Color: Red"
  currentStock: number;
  minStock: number;
  location: "SHOP" | "GODOWN";
}) {
  return sendMail({
    to,
    subject: `Low Stock Alert — ${productName} (${variantInfo})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #dc2626;">⚠️ Low Stock Alert</h2>
        <p>The following product has fallen below the minimum stock level:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Product</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Variant</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${variantInfo}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Location</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${location}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Current Stock</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; color: #dc2626;">${currentStock}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Minimum Stock</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${minStock}</td>
          </tr>
        </table>
        <p style="margin-top: 16px;">Please create a purchase order to restock this item.</p>
      </div>
    `,
  });
}

/** Notify when a purchase order status changes */
export async function sendPurchaseOrderNotification({
  to,
  orderNo,
  status,
  supplierName,
}: {
  to: string | string[];
  orderNo: string;
  status: string;
  supplierName: string;
}) {
  return sendMail({
    to,
    subject: `Purchase Order ${orderNo} — ${status}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2>Purchase Order Update</h2>
        <p>Purchase order <strong>${orderNo}</strong> from supplier <strong>${supplierName}</strong> is now <strong>${status}</strong>.</p>
      </div>
    `,
  });
}