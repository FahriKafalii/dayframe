import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { statsService } from "@dayframe/services";
import {
  requireUserId,
  parseQuery,
  json,
  errorResponse,
} from "@dayframe/lib";

const querySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((v) => v.from <= v.to, { message: "from must be <= to" });

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { from, to } = parseQuery(request.nextUrl.searchParams, querySchema);
    const activity = await statsService.getActivity(userId, from, to);
    return json(activity);
  } catch (err) {
    return errorResponse(err);
  }
}
