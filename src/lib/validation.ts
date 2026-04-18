import { type ZodType } from "zod";
import { AppError } from "@/lib/errors";
import { type NextRequest } from "next/server";

export async function parseBody<T>(request: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError("VALIDATION", "Invalid JSON body");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AppError("VALIDATION", "Validation failed", result.error.issues);
  }
  return result.data;
}

export function parseQuery<T>(params: URLSearchParams, schema: ZodType<T>): T {
  const raw: Record<string, string> = {};
  params.forEach((value, key) => {
    raw[key] = value;
  });
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AppError("VALIDATION", "Invalid query parameters", result.error.issues);
  }
  return result.data;
}

export function parseParams<T>(params: Record<string, string | string[]>, schema: ZodType<T>): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new AppError("VALIDATION", "Invalid path parameters", result.error.issues);
  }
  return result.data;
}
