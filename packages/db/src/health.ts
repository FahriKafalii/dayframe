import { getSequelize } from "./index";

export async function ping(): Promise<boolean> {
  try {
    await getSequelize().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
