function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  get SESSION_SECRET() {
    return required("SESSION_SECRET");
  },
  get NODE_ENV() {
    return optional("NODE_ENV", "development");
  },
  get isProduction() {
    return this.NODE_ENV === "production";
  },
};
