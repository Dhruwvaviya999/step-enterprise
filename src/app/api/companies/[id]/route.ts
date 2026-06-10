import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyUser, requireRole, AuthError } from "@/lib/session";
import { updateCompanySchema } from "@/lib/validators/company";
import { uploadImage } from "@/lib/cloudinary";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiCatch,
  apiValidationError,
} from "@/lib/api-response";

// Company-scoped fields returned to the settings page. `code` is included so it
// can be displayed read-only.
const COMPANY_SELECT = {
  id: true,
  name: true,
  code: true,
  logoUrl: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  country: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Multi-tenancy guard: a user may only ever touch their OWN company. We match
// the route id against the session's companyId and never trust the param alone.
function assertOwnCompany(sessionCompanyId: string, paramId: string) {
  if (sessionCompanyId !== paramId) {
    throw new AuthError("You can only access your own company", 403);
  }
}

// Blank strings from the form become null in the database.
function blankToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// ── GET current company (any company role) ─────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireCompanyUser();
    assertOwnCompany(user.companyId, id);

    const company = await prisma.company.findUnique({
      where: { id },
      select: COMPANY_SELECT,
    });
    if (!company) return apiNotFound("Company not found");

    return apiSuccess(company);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}

// ── PATCH company settings (ADMIN only) ────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // Only a company ADMIN may edit settings. MANAGER/STAFF are view-only.
    const user = await requireRole("ADMIN");
    assertOwnCompany(user.companyId, id);

    const body = await req.json();
    const parsed = updateCompanySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const data = parsed.data;

    // A freshly picked logo arrives as a base64 data URI — upload it to
    // Cloudinary and store the returned secure URL. An existing http(s) URL is
    // left as-is; an empty value clears the logo.
    let logoUrl: string | null | undefined;
    if (data.logoUrl === undefined) {
      logoUrl = undefined; // not provided → leave unchanged
    } else if (data.logoUrl === "") {
      logoUrl = null; // cleared
    } else if (data.logoUrl.startsWith("data:")) {
      try {
        const result = await uploadImage(data.logoUrl, "companies/logos");
        logoUrl = result.secure_url;
      } catch {
        return apiError("Logo upload failed. Please try again.", 502);
      }
    } else {
      logoUrl = data.logoUrl; // unchanged remote URL
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: data.name.trim(),
        email: blankToNull(data.email),
        phone: blankToNull(data.phone),
        address: blankToNull(data.address),
        city: blankToNull(data.city),
        state: blankToNull(data.state),
        country: blankToNull(data.country),
        isActive: data.isActive,
        ...(logoUrl !== undefined ? { logoUrl } : {}),
      },
      select: COMPANY_SELECT,
    });

    return apiSuccess(company);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}
