import { Sequelize } from "sequelize";
import { env } from "@/lib/env";
import { registerModels } from "@/models";

interface DbGlobal {
  sequelize?: Sequelize;
  initialized?: boolean;
}

const globalForDb = globalThis as unknown as { __dayframe_db?: DbGlobal };
const store: DbGlobal = (globalForDb.__dayframe_db ??= {});

export function getSequelize(): Sequelize {
  if (!store.sequelize) {
    store.sequelize = new Sequelize(env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      pool: { max: 10, min: 1, acquire: 30_000, idle: 10_000 },
    });
  }
  return store.sequelize;
}

export async function initDb(): Promise<void> {
  if (store.initialized) return;
  const seq = getSequelize();
  registerModels(seq);
  store.initialized = true;
}

export { Sequelize };
