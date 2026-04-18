import { type NextRequest } from "next/server";
import { initDb } from "@dayframe/db";
import { statsService } from "@dayframe/services";
import { requireUserId, json, errorResponse } from "@dayframe/lib";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const summary = await statsService.getSummary(userId);
    return json(summary);
  } catch (err) {
    return errorResponse(err);
  }
}
