import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { kasaSummaryService, transactionService } from "@dayframe/services";
import { requireUserId, parseBody, json, errorResponse } from "@dayframe/lib";

const POSITIVE_DECIMAL = /^(0|[1-9]\d*)(\.\d{1,4})?$/;
const CURRENCY_CODE = /^[A-Z]{3,5}$/;

const updateSchema = z.object({
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().nullable().optional(),
  type: z.enum(["expense", "income", "adjustment"]).optional(),
  amount: z.string().regex(POSITIVE_DECIMAL, "Tutar pozitif bir sayı olmalı").optional(),
  currency: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(CURRENCY_CODE, "Geçersiz para birimi kodu (3-5 harf)"))
    .optional(),
  occurred_at: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.string().datetime()])
    .optional(),
  status: z.enum(["planned", "pending", "cleared", "reconciled"]).optional(),
  payee: z.string().max(160).optional(),
  note: z.string().max(2000).optional(),
  location: z.string().max(160).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await ctx.params;
    const tx = await transactionService.get(id, userId);
    return json(kasaSummaryService.txToDto(tx));
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
    const tx = await transactionService.update(id, userId, body);
    return json(kasaSummaryService.txToDto(tx));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await ctx.params;
    await transactionService.remove(id, userId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
