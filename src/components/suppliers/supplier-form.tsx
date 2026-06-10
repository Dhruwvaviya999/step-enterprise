"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { supplierSchema, type SupplierInput } from "@/lib/validators/supplier";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Supplier } from "./supplier-table";

interface ApiError {
  status?: number;
  message?: string;
  data?: { errors?: Record<string, string[]> } | null;
}

function toFormValues(s: Supplier | null): SupplierInput {
  return {
    name: s?.name ?? "",
    phone: s?.phone ?? "",
    email: s?.email ?? "",
    address: s?.address ?? "",
  };
}

/**
 * Create/edit supplier dialog. `supplier` null → create, otherwise edit. On
 * success it hands the saved supplier back to the parent via `onSaved`.
 */
export function SupplierForm({
  open,
  onOpenChange,
  supplier,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSaved: (supplier: Supplier) => void;
}) {
  const isEdit = !!supplier;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: toFormValues(null),
  });

  // Re-seed the fields whenever the dialog opens for a different supplier.
  useEffect(() => {
    if (open) reset(toFormValues(supplier));
  }, [open, supplier, reset]);

  async function onSubmit(values: SupplierInput) {
    try {
      const res = isEdit
        ? await axiosInstance.patch<{ data: Supplier }>(
            `/suppliers/${supplier!.id}`,
            values,
          )
        : await axiosInstance.post<{ data: Supplier }>("/suppliers", values);

      onSaved(res.data.data);
      toast.success(isEdit ? "Supplier updated" : "Supplier created");
      onOpenChange(false);
    } catch (err) {
      const error = err as ApiError;
      const fieldErrors = error.data?.errors;
      if (fieldErrors) {
        let mapped = false;
        for (const key of ["name", "phone", "email", "address"] as const) {
          if (fieldErrors[key]?.[0]) {
            setError(key, { message: fieldErrors[key][0] });
            mapped = true;
          }
        }
        if (mapped) return;
      }
      toast.error(error.message ?? "Could not save the supplier.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit supplier" : "Add supplier"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update this supplier's contact details."
                : "Add a supplier your company purchases stock from."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="supplier-name">Name</FieldLabel>
              <Input
                id="supplier-name"
                placeholder="Bata Distributors"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="supplier-phone">Phone</FieldLabel>
                <Input
                  id="supplier-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                <FieldError errors={errors.phone ? [errors.phone] : undefined} />
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="supplier-email">Email</FieldLabel>
                <Input
                  id="supplier-email"
                  type="email"
                  placeholder="sales@supplier.com"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={errors.email ? [errors.email] : undefined} />
              </Field>
            </div>

            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor="supplier-address">Address</FieldLabel>
              <Textarea
                id="supplier-address"
                rows={3}
                placeholder="123 Market Road, Mumbai"
                disabled={isSubmitting}
                aria-invalid={!!errors.address}
                {...register("address")}
              />
              <FieldError errors={errors.address ? [errors.address] : undefined} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isEdit ? "Save changes" : "Add supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
