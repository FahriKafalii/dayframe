import { Sequelize } from "sequelize";
import { env } from "@dayframe/lib";
import { registerModels } from "@dayframe/models";

interface DbGlobal {
  sequelize?: Sequelize;
}

const globalForDb = globalThis as unknown as { __dayframe_db?: DbGlobal };
const store: DbGlobal = (globalForDb.__dayframe_db ??= {});

let modelsRegistered = false;

/**
 * Remove `sslmode` and `channel_binding` from a Postgres connection string.
 * These are negotiated by node-postgres' URL parser and can break the TLS
 * handshake on serverless runtimes; we drive SSL via dialectOptions instead.
 * Falls back to a no-op if the URL can't be parsed.
 */
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
    // Managed Postgres (Neon, Supabase, Vercel PG) requires SSL. Detect it from
    // the connection string; local Docker postgres does not use SSL.
    const rawUrl = env.DATABASE_URL;
    const needsSsl =
      /sslmode=require/i.test(rawUrl) || /\.neon\.tech/i.test(rawUrl);
    // SSL is configured explicitly via dialectOptions below. Leaving
    // `sslmode`/`channel_binding` in the URL makes node-postgres' own parser
    // negotiate TLS too, which fails the handshake in some serverless runtimes
    // (Vercel). Strip them so our dialectOptions are the single source of truth.
    const url = needsSsl ? stripSslQueryParams(rawUrl) : rawUrl;
    store.sequelize = new Sequelize(url, {
      dialect: "postgres",
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
