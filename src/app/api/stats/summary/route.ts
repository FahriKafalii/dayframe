import { type NextRequest } from "next/server";
import { initDb } from "@/db";
import { statsService } from "@/services/statsService";
import { requireUserId } from "@/lib/auth";
import { json, errorResponse } from "@/lib/http";

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
