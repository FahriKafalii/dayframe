import { getSequelize } from "./index";

export async function ping(): Promise<boolean> {
  try {
    await getSequelize().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// Like ping() but returns the error so the health endpoint can report why the
// database is unreachable.
export async function pingDetail(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getSequelize().query("SELECT 1");
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err ?? "unknown error");
    return { ok: false, error: message };
  }
}
