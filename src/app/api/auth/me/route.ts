import { type NextRequest } from "next/server";
import { initDb } from "@/db";
import { authService } from "@/services/authService";
import { requireUserId } from "@/lib/auth";
import { json, errorResponse } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const user = await authService.me(userId);
    return json(user);
  } catch (err) {
    return errorResponse(err);
  }
}
