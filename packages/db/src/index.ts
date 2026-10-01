import { Sequelize } from "sequelize";
// Static import so Next's tracer bundles pg into the serverless function;
// passed to Sequelize as dialectModule instead of its dynamic require.
import pg from "pg";
import { env } from "@dayframe/lib";
import { registerModels } from "@dayframe/models";

interface DbGlobal {
  sequelize?: Sequelize;
}

const globalForDb = globalThis as unknown as { __dayframe_db?: DbGlobal };
const store: DbGlobal = (globalForDb.__dayframe_db ??= {});

let modelsRegistered = false;

// SSL is driven via dialectOptions; keeping sslmode/channel_binding in the URL
// made node-postgres negotiate TLS too and break the handshake on Vercel.
function stripSslQueryParams(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getSequelize(): Sequelize {
  if (!store.sequelize) {
    // Managed Postgres (Neon etc.) needs SSL; local Docker does not.
    const rawUrl = env.DATABASE_URL;
    const needsSsl =
      /sslmode=require/i.test(rawUrl) || /\.neon\.tech/i.test(rawUrl);
    const url = needsSsl ? stripSslQueryParams(rawUrl) : rawUrl;
    store.sequelize = new Sequelize(url, {
      dialect: "postgres",
      dialectModule: pg,
      logging: false,
      pool: { max: 10, min: 1, acquire: 30_000, idle: 10_000 },
      ...(needsSsl
        ? {
            dialectOptions: {
              ssl: { require: true, rejectUnauthorized: false },
            },
          }
        : {}),
    });
  }
  return store.sequelize;
}

export async function initDb(): Promise<void> {
  if (modelsRegistered) return;
  const seq = getSequelize();
  registerModels(seq);
  modelsRegistered = true;
}

export { Sequelize };
export { ping, pingDetail } from "./health";
export { KASA_SEED_CATEGORIES, KASA_SEED_ACCOUNTS } from "./kasaSeed";
export type { SeedCategory, SeedAccount } from "./kasaSeed";
