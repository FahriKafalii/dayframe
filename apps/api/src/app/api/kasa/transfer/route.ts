import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { transactionService } from "@dayframe/services";
import { requireUserId, parseBody, json, errorResponse } from "@dayframe/lib";

const transferSchema = z.object({
  from_account_id: z.string().uuid(),
  to_account_id: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  to_amount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  occurred_at: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().datetime(),
  ]),
  note: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const body = await parseBody(request, transferSchema);
    const result = await transactionService.transfer(userId, body);
    return json(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
