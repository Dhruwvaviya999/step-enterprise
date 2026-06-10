import { prisma } from "@/lib/prisma";
import { apiSuccess, apiCatch } from "@/lib/api-response";

// Public — used by the company login page to populate the company selector.
// Returns only id + name (no sensitive data).
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return apiSuccess(companies);
  } catch (error) {
    return apiCatch(error);
  }
}