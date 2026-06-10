"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";

import {
  companyLoginSchema,
  loginErrorMessage,
  type CompanyLoginInput,
} from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyLoginInput>({
    resolver: zodResolver(companyLoginSchema),
    defaultValues: { companyCode: "", username: "", password: "" },
  });

  async function onSubmit(data: CompanyLoginInput) {
    setServerError(null);

    const result = await signIn("company-login", {
      companyCode: data.companyCode,
      username: data.username,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      // `code` is set by our LoginError on the server; map it to a message.
      setServerError(loginErrorMessage(result.code));
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your company code and username.
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {/* Company code */}
          <Field data-invalid={!!errors.companyCode}>
            <FieldLabel htmlFor="companyCode">Company code</FieldLabel>
            <Input
              id="companyCode"
              placeholder="e.g. ACME-1234"
              autoComplete="organization"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={isSubmitting}
              aria-invalid={!!errors.companyCode}
              {...register("companyCode")}
            />
            <FieldError
              errors={errors.companyCode ? [errors.companyCode] : undefined}
            />
          </Field>

          {/* Username */}
          <Field data-invalid={!!errors.username}>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              placeholder="e.g. admin01"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={isSubmitting}
              aria-invalid={!!errors.username}
              {...register("username")}
            />
            <FieldError
              errors={errors.username ? [errors.username] : undefined}
            />
          </Field>

          {/* Password */}
          <Field data-invalid={!!errors.password}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <FieldError
              errors={errors.password ? [errors.password] : undefined}
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        No account yet? Ask your company admin to create one for you.
      </p>
    </div>
  );
}
