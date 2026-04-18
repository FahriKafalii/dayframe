import { Sequelize } from "sequelize";
import { env } from "@/lib/env";
import { registerModels } from "@/models";

let instance: Sequelize | null = null;
let initialized = false;

export function getSequelize(): Sequelize {
  if (!instance) {
    instance = new Sequelize(env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      pool: { max: 10, min: 1, acquire: 30_000, idle: 10_000 },
    });
  }
  return instance;
}

export async function initDb(): Promise<void> {
  if (initialized) return;
  const seq = getSequelize();
  registerModels(seq);
  initialized = true;
}

export { Sequelize };
