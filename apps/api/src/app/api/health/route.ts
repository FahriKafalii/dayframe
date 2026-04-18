import { initDb, ping } from "@dayframe/db";
import { json } from "@dayframe/lib";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
  } catch {
    return json({ status: "degraded", db: "down" }, 503);
  }

  const dbOk = await ping();
  if (dbOk) {
    return json({ status: "ok", db: "ok" });
  }
  return json({ status: "degraded", db: "down" }, 503);
}
