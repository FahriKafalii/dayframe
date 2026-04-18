import { type NextRequest } from "next/server";
import { initDb } from "@dayframe/db";
import { authService } from "@dayframe/services";
import { requireUserId, json, errorResponse } from "@dayframe/lib";

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
