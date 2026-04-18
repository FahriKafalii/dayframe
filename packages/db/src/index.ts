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
    store.sequelize = new Sequelize(env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      pool: { max: 10, min: 1, acquire: 30_000, idle: 10_000 },
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
