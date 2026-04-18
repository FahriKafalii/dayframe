"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, status } = useAuth();
  const { t } = useT();

  useEffect(() => {
    if (status === "authenticated") router.replace("/app");
  }, [status, router]);

  const schema = useMemo(
    () =>
      z
        .object({
          username: z
            .string()
            .min(3, t("auth.usernameMin"))
            .regex(/^[a-zA-Z0-9_.-]+$/, t("auth.usernameRegex")),
          password: z.string().min(8, t("auth.passwordMin8")),
          confirm: z.string().min(8, t("auth.passwordMin8")),
        })
        .refine((v) => v.password === v.confirm, {
          path: ["confirm"],
          message: t("auth.passwordsDontMatch"),
        }),
    [t],
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await registerUser(values.username, values.password);
      toast.success(t("auth.accountCreated"));
      router.replace("/app");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("auth.registerFailed");
      toast.error(message);
    }
  }

  return (
    <AuthCard
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={
        <>
          {t("auth.alreadyHaveAccount")}{" "}
          <Link
            href="/login"
            className="text-[color:var(--color-fg)] underline underline-offset-4"
          >
            {t("common.signIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="username" required>
            {t("auth.username")}
          </Label>
          <Input
            id="username"
            autoComplete="username"
            autoFocus
            invalid={!!errors.username}
            {...register("username")}
          />
          <FieldError>{errors.username?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="password" required>
            {t("auth.password")}
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="confirm" required>
            {t("auth.confirmPassword")}
          </Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.confirm}
            {...register("confirm")}
          />
          <FieldError>{errors.confirm?.message}</FieldError>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("common.creating") : t("common.createAccount")}
        </Button>
      </form>
    </AuthCard>
  );
}
