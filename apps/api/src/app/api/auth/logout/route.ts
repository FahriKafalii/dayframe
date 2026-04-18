import { json, errorResponse, clearCookieHeaders } from "@dayframe/lib";

export async function POST() {
  try {
    const response = json({ ok: true });
    response.headers.set("Set-Cookie", clearCookieHeaders());
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
