"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, TriangleAlert, ShieldCheck } from "lucide-react";

import {
  superAdminLoginSchema,
  type SuperAdminLoginInput,
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

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SuperAdminLoginInput>({
    resolver: zodResolver(superAdminLoginSchema),
  });

  async function onSubmit(data: SuperAdminLoginInput) {
    setServerError(null);

    const result = await signIn("super-admin-login", {
      identifier: data.identifier,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Invalid credentials.");
      return;
    }

    router.push("/super-admin");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-foreground text-background">
          <ShieldCheck className="size-5.5" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            Platform administration
          </h1>
          <p className="text-sm text-muted-foreground">
            Restricted to Stocker operators. Company staff should use the{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              company login
            </Link>
            .
          </p>
        </div>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.identifier}>
            <FieldLabel htmlFor="identifier">Username or email</FieldLabel>
            <Input
              id="identifier"
              placeholder="operator or you@stocker.app"
              autoComplete="username"
              autoFocus
              disabled={isSubmitting}
              aria-invalid={!!errors.identifier}
              {...register("identifier")}
            />
            <FieldError
              errors={errors.identifier ? [errors.identifier] : undefined}
            />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
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
    </div>
  );
}