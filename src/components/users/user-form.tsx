"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { updateUserSchema, type UpdateUserInput } from "@/lib/validators/user";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { type UserRow, COMPANY_ROLES, ROLE_META } from "./types";

interface ApiError {
  message?: string;
  data?: { errors?: Record<string, string[]> } | null;
}

// One resolver for both modes: password is optional here; on create we require
// it manually (the server's createUserSchema also enforces it).
function defaultsFor(user: UserRow | null): UpdateUserInput {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: (user?.role as UpdateUserInput["role"]) ?? "STAFF",
    isActive: user?.isActive ?? true,
    password: "",
  };
}

export function UserForm({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null;
  onSaved: (user: UserRow) => void;
}) {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: defaultsFor(user),
  });

  useEffect(() => {
    if (open) {
      reset(defaultsFor(user));
      setShowPassword(false);
    }
  }, [open, user, reset]);

  async function onSubmit(values: UpdateUserInput) {
    const password = values.password?.trim() ?? "";
    if (!isEdit && !password) {
      setError("password", { message: "Password is required" });
      return;
    }

    const payload = {
      name: values.name,
      email: values.email ?? "",
      role: values.role,
      isActive: values.isActive,
      ...(password ? { password } : {}),
    };

    try {
      const res = isEdit
        ? await axiosInstance.patch<{ data: UserRow }>(`/users/${user!.id}`, payload)
        : await axiosInstance.post<{ data: UserRow }>("/users", payload);
      const saved = res.data.data;
      onSaved(saved);
      if (isEdit) {
        toast.success("User updated");
      } else {
        toast.success("User created", {
          description: `Username: ${saved.username}`,
        });
      }
      onOpenChange(false);
    } catch (err) {
      const error = err as ApiError;
      const fieldErrors = error.data?.errors;
      if (fieldErrors) {
        for (const key of ["name", "email", "password", "role"] as const) {
          if (fieldErrors[key]?.[0]) setError(key, { message: fieldErrors[key][0] });
        }
        return;
      }
      toast.error(error.message ?? "Could not save the user.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? `Update this user's details${user?.username ? ` (${user.username})` : ""}.`
                : "Create a login for a team member. The username is generated from the role."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="u-name">Name</FieldLabel>
              <Input
                id="u-name"
                placeholder="Jane Doe"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.role}>
                <FieldLabel htmlFor="u-role">Role</FieldLabel>
                <NativeSelect
                  id="u-role"
                  className="w-full"
                  disabled={isSubmitting}
                  {...register("role")}
                >
                  {COMPANY_ROLES.map((r) => (
                    <NativeSelectOption key={r} value={r}>
                      {ROLE_META[r].label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="u-email">Email (optional)</FieldLabel>
                <Input
                  id="u-email"
                  type="email"
                  placeholder="jane@company.com"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={errors.email ? [errors.email] : undefined} />
              </Field>
            </div>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="u-password">
                {isEdit ? "New password" : "Password"}
              </FieldLabel>
              <div className="relative">
                <Input
                  id="u-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isEdit ? "Leave blank to keep current" : "At least 8 characters"}
                  autoComplete="new-password"
                  className="pr-10"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldError errors={errors.password ? [errors.password] : undefined} />
            </Field>

            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FieldLabel htmlFor="u-active">Active</FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Inactive users can&apos;t sign in.
                    </p>
                  </div>
                  <Switch
                    id="u-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            />

            {!isEdit && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Username preview:
                <Badge variant="outline" className="font-mono">
                  e.g. staff01
                </Badge>
              </p>
            )}
          </div>

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
              {isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
