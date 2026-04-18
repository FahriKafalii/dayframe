import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@/db";
import { authService } from "@/services/authService";
import { parseBody } from "@/lib/validation";
import { json, errorResponse } from "@/lib/http";

const schema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await parseBody(request, schema);
    const user = await authService.register(body.username, body.password);
    return json(user, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
