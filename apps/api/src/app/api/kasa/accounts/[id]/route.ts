import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { accountService, accountToDto } from "@dayframe/services";
import { requireUserId, parseBody, json, errorResponse } from "@dayframe/lib";

const POSITIVE_DECIMAL = /^(0|[1-9]\d*)(\.\d{1,4})?$/;
const SIGNED_DECIMAL = /^-?(0|[1-9]\d*)(\.\d{1,4})?$/;
const CURRENCY_CODE = /^[A-Z]{3,5}$/;

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  currency: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(CURRENCY_CODE, "Geçersiz para birimi kodu (3-5 harf)"))
    .optional(),
  opening_balance: z.string().regex(SIGNED_DECIMAL, "Açılış bakiyesi geçersiz").optional(),
  opening_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(40).optional(),
  credit_limit: z.string().regex(POSITIVE_DECIMAL, "Kredi limiti geçersiz").optional(),
  statement_day: z.number().int().min(1).max(31).optional(),
  due_day: z.number().int().min(1).max(31).optional(),
  bank_name: z.string().max(120).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  notes: z.string().max(2000).optional(),
  is_archived: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await ctx.params;
    const account = await accountService.get(id, userId);
    return json(await accountToDto(account, userId));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await ctx.params;
    const body = await parseBody(request, updateSchema);
    const account = await accountService.update(id, userId, body);
    return json(await accountToDto(account, userId));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await ctx.params;
    await accountService.remove(id, userId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
