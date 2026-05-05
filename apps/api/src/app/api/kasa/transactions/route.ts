import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import {
  kasaSeedService,
  kasaSummaryService,
  transactionService,
} from "@dayframe/services";
import {
  requireUserId,
  parseBody,
  parseQuery,
  json,
  errorResponse,
} from "@dayframe/lib";

const createSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  type: z.enum(["expense", "income", "adjustment"]),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currency: z.string().min(2).max(8).optional(),
  occurred_at: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().datetime(),
  ]),
  status: z.enum(["planned", "pending", "cleared", "reconciled"]).optional(),
  payee: z.string().max(160).optional(),
  note: z.string().max(2000).optional(),
  location: z.string().max(160).optional(),
});

const querySchema = z.object({
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  type: z.enum(["expense", "income", "transfer_out", "transfer_in", "adjustment"]).optional(),
  status: z.enum(["planned", "pending", "cleared", "reconciled"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    await kasaSeedService.ensureSeeded(userId);
    const filters = parseQuery(request.nextUrl.searchParams, querySchema);
    const txs = await transactionService.list(userId, filters);
    return json(txs.map(kasaSummaryService.txToDto));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const body = await parseBody(request, createSchema);
    const tx = await transactionService.create(userId, {
      ...body,
      currency: body.currency ?? "TRY",
      status: body.status ?? "cleared",
    });
    return json(kasaSummaryService.txToDto(tx), 201);
  } catch (err) {
    return errorResponse(err);
  }
}
