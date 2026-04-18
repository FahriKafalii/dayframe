import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { authService } from "@dayframe/services";
import { parseBody, json, errorResponse } from "@dayframe/lib";

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
