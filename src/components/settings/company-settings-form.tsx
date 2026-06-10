"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Info, Lock, TriangleAlert } from "lucide-react";

import {
  updateCompanySchema,
  type UpdateCompanyInput,
} from "@/lib/validators/company";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { CompanyLogoUploader } from "./company-logo-uploader";

// Subset of Company the form reads/writes. `code` is display-only.
export interface CompanySettings {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isActive: boolean;
}

interface ApiError {
  status?: number;
  message?: string;
  data?: { errors?: Record<string, string[]> } | null;
}

function toFormValues(c: CompanySettings): UpdateCompanyInput {
  return {
    name: c.name ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    country: c.country ?? "",
    logoUrl: c.logoUrl ?? "",
    isActive: c.isActive,
  };
}

export function CompanySettingsForm({
  company,
  canEdit,
}: {
  company: CompanySettings;
  canEdit: boolean;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: toFormValues(company),
  });

  const readOnly = !canEdit;

  async function onSubmit(values: UpdateCompanyInput) {
    if (readOnly) return;
    try {
      const res = await axiosInstance.patch<{ data: CompanySettings }>(
        `/companies/${company.id}`,
        values,
      );
      // Re-seed the form with the saved values so the dirty state resets and a
      // newly uploaded logo shows its final Cloudinary URL.
      reset(toFormValues(res.data.data));
      toast.success("Company settings saved");
      router.refresh();
    } catch (err) {
      const error = err as ApiError;
      const fieldErrors = error.data?.errors;
      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof UpdateCompanyInput, { message: messages[0] });
          }
        }
        toast.error("Please fix the highlighted fields.");
        return;
      }
      toast.error(error.message ?? "Could not save settings.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {readOnly && (
        <Alert>
          <Info />
          <AlertDescription>
            You have view-only access. Only an administrator can edit company
            settings.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Identity ── */}
      <Card>
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
          <CardDescription>
            Your company name, logo and unique code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <Controller
                control={control}
                name="logoUrl"
                render={({ field }) => (
                  <CompanyLogoUploader
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={readOnly}
                  />
                )}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Company name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Acme Footwear"
                  disabled={readOnly || isSubmitting}
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>

              <Field>
                <FieldLabel htmlFor="code">
                  Company code
                  <Lock className="size-3 text-muted-foreground" />
                </FieldLabel>
                <Input
                  id="code"
                  value={company.code}
                  readOnly
                  disabled
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Used for login. This cannot be changed.
                </p>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* ── Contact ── */}
      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
          <CardDescription>How customers and suppliers reach you.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@company.com"
                  disabled={readOnly || isSubmitting}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={errors.email ? [errors.email] : undefined} />
              </Field>

              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  disabled={readOnly || isSubmitting}
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                <FieldError errors={errors.phone ? [errors.phone] : undefined} />
              </Field>
            </div>

            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                id="address"
                placeholder="123 Market Road"
                disabled={readOnly || isSubmitting}
                aria-invalid={!!errors.address}
                {...register("address")}
              />
              <FieldError errors={errors.address ? [errors.address] : undefined} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field data-invalid={!!errors.city}>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  id="city"
                  placeholder="Mumbai"
                  disabled={readOnly || isSubmitting}
                  aria-invalid={!!errors.city}
                  {...register("city")}
                />
                <FieldError errors={errors.city ? [errors.city] : undefined} />
              </Field>

              <Field data-invalid={!!errors.state}>
                <FieldLabel htmlFor="state">State</FieldLabel>
                <Input
                  id="state"
                  placeholder="Maharashtra"
                  disabled={readOnly || isSubmitting}
                  aria-invalid={!!errors.state}
                  {...register("state")}
                />
                <FieldError errors={errors.state ? [errors.state] : undefined} />
              </Field>

              <Field data-invalid={!!errors.country}>
                <FieldLabel htmlFor="country">Country</FieldLabel>
                <Input
                  id="country"
                  placeholder="India"
                  disabled={readOnly || isSubmitting}
                  aria-invalid={!!errors.country}
                  {...register("country")}
                />
                <FieldError
                  errors={errors.country ? [errors.country] : undefined}
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* ── Status ── */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Whether this company workspace is active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <FieldLabel htmlFor="isActive">Company active</FieldLabel>
                    <Badge variant={field.value ? "default" : "secondary"}>
                      {field.value ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Inactive companies are hidden from day-to-day operations.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={readOnly || isSubmitting}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex items-center justify-end gap-3">
          {isDirty && (
            <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
              <TriangleAlert className="size-3.5" />
              Unsaved changes
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isSubmitting}
            onClick={() => reset(toFormValues(company))}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </form>
  );
}
