"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, TriangleAlert } from "lucide-react";

import {
  registerCompanySchema,
  type RegisterCompanyInput,
} from "@/lib/validators/company";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSeparator,
} from "@/components/ui/field";

interface ApiError {
  status?: number;
  message?: string;
  data?: { errors?: Record<string, string[]> } | null;
}

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCompanyInput>({
    resolver: zodResolver(registerCompanySchema),
    defaultValues: {
      companyName: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  async function onSubmit(data: RegisterCompanyInput) {
    setServerError(null);
    try {
      const res = await axiosInstance.post<{
        data: { company: { name: string; code: string } };
      }>("/companies", data);

      const { name, code } = res.data.data.company;
      toast.success(`${name} registered`, {
        description: `Company code: ${code}`,
      });

      router.push("/super-admin");
      router.refresh();
    } catch (err) {
      const error = err as ApiError;

      // Map server-side field errors (422) back onto the form.
      const fieldErrors = error.data?.errors;
      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof RegisterCompanyInput, {
              message: messages[0],
            });
          }
        }
        return;
      }

      setServerError(error.message ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        render={<Link href="/super-admin" />}
      >
        <ArrowLeft className="size-4" />
        Back to companies
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Register a company</CardTitle>
          <CardDescription>
            Creates the company and its first admin account. A unique company
            code is generated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <Alert variant="destructive" className="mb-6">
              <TriangleAlert />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.companyName}>
                <FieldLabel htmlFor="companyName">Company name</FieldLabel>
                <Input
                  id="companyName"
                  placeholder="Acme Traders"
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={!!errors.companyName}
                  {...register("companyName")}
                />
                <FieldError
                  errors={errors.companyName ? [errors.companyName] : undefined}
                />
              </Field>

              <FieldSeparator>Company admin</FieldSeparator>

              <Field data-invalid={!!errors.adminName}>
                <FieldLabel htmlFor="adminName">Admin name</FieldLabel>
                <Input
                  id="adminName"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.adminName}
                  {...register("adminName")}
                />
                <FieldError
                  errors={errors.adminName ? [errors.adminName] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.adminEmail}>
                <FieldLabel htmlFor="adminEmail">Admin email</FieldLabel>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@company.com"
                  autoComplete="off"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.adminEmail}
                  {...register("adminEmail")}
                />
                <FieldError
                  errors={errors.adminEmail ? [errors.adminEmail] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.adminPassword}>
                <FieldLabel htmlFor="adminPassword">Temporary password</FieldLabel>
                <div className="relative">
                  <Input
                    id="adminPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.adminPassword}
                    className="pr-10"
                    {...register("adminPassword")}
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
                  errors={
                    errors.adminPassword ? [errors.adminPassword] : undefined
                  }
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && <Spinner />}
                {isSubmitting ? "Registering…" : "Register company"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
