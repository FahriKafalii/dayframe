import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import {
  accountService,
  accountToDto,
  accountsToDtos,
  kasaSeedService,
} from "@dayframe/services";
import { requireUserId, parseBody, json, errorResponse } from "@dayframe/lib";

// Strict positive decimal: rejects scientific notation, leading zeros ("00.5"),
// and negatives. Mirrors POSITIVE_DECIMAL in accountService.ts.
const POSITIVE_DECIMAL = /^(0|[1-9]\d*)(\.\d{1,4})?$/;
const SIGNED_DECIMAL = /^-?(0|[1-9]\d*)(\.\d{1,4})?$/;
const CURRENCY_CODE = /^[A-Z]{3,5}$/;

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum([
    "cash",
    "checking",
    "savings",
    "credit_card",
    "debit_card",
    "prepaid",
    "wallet",
    "investment",
    "loan",
    "gold",
    "crypto",
  ]),
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
});

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    await kasaSeedService.ensureSeeded(userId);
    const accounts = await accountService.list(userId);
    const dtos = await accountsToDtos(accounts, userId);
    return json(dtos);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const body = await parseBody(request, createSchema);
    const account = await accountService.create(userId, {
      ...body,
      currency: body.currency ?? "TRY",
      opening_balance: body.opening_balance ?? "0",
    });
    return json(await accountToDto(account, userId), 201);
  } catch (err) {
    return errorResponse(err);
  }
}
