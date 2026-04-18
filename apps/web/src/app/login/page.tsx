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

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const { t } = useT();

  useEffect(() => {
    if (status === "authenticated") router.replace("/app");
  }, [status, router]);

  const schema = useMemo(
    () =>
      z.object({
        username: z.string().min(3, t("auth.usernameMin")),
        password: z.string().min(6, t("auth.passwordMin6")),
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
      await login(values.username, values.password);
      toast.success(t("common.welcomeBack"));
      router.replace("/app");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("auth.signInFailed");
      toast.error(message);
    }
  }

  return (
    <AuthCard
      title={t("auth.signInTitle")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        <>
          {t("auth.newHere")}{" "}
          <Link
            href="/register"
            className="text-[color:var(--color-fg)] underline underline-offset-4"
          >
            {t("common.createAccount")}
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
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("common.signingIn") : t("common.signIn")}
        </Button>
      </form>
    </AuthCard>
  );
}
