import { prisma } from "@/lib/prisma";

// Derive a short, readable base from the company name: A–Z and 0–9 only.
function codeBase(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  return base || "CO";
}

// Generate a unique `Company.code` (e.g. "SHUBHA-4821"). The code column is
// UNIQUE, so we probe the DB until we find an unused value.
export async function generateUniqueCompanyCode(name: string): Promise<string> {
  const base = codeBase(name);

  for (let attempt = 0; attempt < 25; attempt++) {
    const suffix = Math.floor(1000 + Math.random() * 9000); // 4 digits
    const code = `${base}-${suffix}`;

    const existing = await prisma.company.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }

  throw new Error("Could not generate a unique company code");
}
