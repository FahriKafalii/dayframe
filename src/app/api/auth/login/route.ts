import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@/db";
import { authService } from "@/services/authService";
import { parseBody } from "@/lib/validation";
import { json, errorResponse } from "@/lib/http";
import { createSessionCookie, setCookieHeaders } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await parseBody(request, schema);
    const user = await authService.login(body.username, body.password);
    const cookie = createSessionCookie(user.id);
    const response = json(user);
    response.headers.set("Set-Cookie", setCookieHeaders(cookie));
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
