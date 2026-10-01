import { initDb, pingDetail } from "@dayframe/db";
import { json } from "@dayframe/lib";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return json({ status: "degraded", db: "down", stage: "init", error }, 503);
  }

  const result = await pingDetail();
  if (result.ok) {
    return json({ status: "ok", db: "ok" });
  }
  return json(
    { status: "degraded", db: "down", stage: "ping", error: result.error },
    503,
  );
}
