import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { apiSuccess, apiValidationError, apiCatch } from "@/lib/api-response";

// NOTE: This is a stub. The actual reset-token generation + email send will be
// wired up in a later step (using lib/mail.ts). For now it validates input and
// always returns a generic success so attackers can't enumerate valid emails.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // TODO: generate reset token, persist it, and email a reset link.
      // await sendPasswordResetEmail({ to: email, token });
    }

    // Always generic — never reveal whether the email exists.
    return apiSuccess({
      message: "If an account exists for that email, a reset link is on its way.",
    });
  } catch (error) {
    return apiCatch(error);
  }
}