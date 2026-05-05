import { type NextRequest } from "next/server";
import { initDb } from "@dayframe/db";
import { kasaSeedService, kasaSummaryService } from "@dayframe/services";
import { requireUserId, json, errorResponse } from "@dayframe/lib";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    await kasaSeedService.ensureSeeded(userId);
    const summary = await kasaSummaryService.build(userId);
    return json(summary);
  } catch (err) {
    return errorResponse(err);
  }
}
