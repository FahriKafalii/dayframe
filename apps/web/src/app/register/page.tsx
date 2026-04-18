"use client";

import { useEffect } from "react";
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

const schema = z
  .object({
    username: z
      .string()
      .min(3, "At least 3 characters")
      .regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, . _ - only"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(8, "At least 8 characters"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") router.replace("/app");
  }, [status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await registerUser(values.username, values.password);
      toast.success("Account created");
      router.replace("/app");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Registration failed";
      toast.error(message);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start building a calmer, more deliberate day."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[color:var(--color-fg)] underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="username" required>
            Username
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
            Password
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
            Confirm password
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
          {isSubmitting ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
