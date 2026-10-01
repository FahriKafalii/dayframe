import { Sequelize } from "sequelize";
import { env } from "@dayframe/lib";
import { registerModels } from "@dayframe/models";

interface DbGlobal {
  sequelize?: Sequelize;
}

const globalForDb = globalThis as unknown as { __dayframe_db?: DbGlobal };
const store: DbGlobal = (globalForDb.__dayframe_db ??= {});

let modelsRegistered = false;

export function getSequelize(): Sequelize {
  if (!store.sequelize) {
    // Managed Postgres (Neon, Supabase, Vercel PG) requires SSL. Detect it from
    // the connection string; local Docker postgres does not use SSL.
    const url = env.DATABASE_URL;
    const needsSsl =
      /sslmode=require/i.test(url) || /\.neon\.tech/i.test(url);
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
export { ping } from "./health";
export { KASA_SEED_CATEGORIES, KASA_SEED_ACCOUNTS } from "./kasaSeed";
export type { SeedCategory, SeedAccount } from "./kasaSeed";
