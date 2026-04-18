import { json, errorResponse } from "@/lib/http";
import { clearCookieHeaders } from "@/lib/auth";

export async function POST() {
  try {
    const response = json({ ok: true });
    response.headers.set("Set-Cookie", clearCookieHeaders());
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
