import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { kasaAnalyticsService, kasaSeedService } from "@dayframe/services";
import {
  requireUserId,
  parseQuery,
  json,
  errorResponse,
} from "@dayframe/lib";

const querySchema = z.object({
  horizon: z.coerce.number().int().min(1).max(365).optional(),
  lookback: z.coerce.number().int().min(7).max(180).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    await kasaSeedService.ensureSeeded(userId);
    const { horizon, lookback } = parseQuery(
      request.nextUrl.searchParams,
      querySchema,
    );
    const data = await kasaAnalyticsService.forecast(userId, {
      horizonDays: horizon,
      lookbackDays: lookback,
    });
    return json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
