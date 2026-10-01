// Managed Postgres (Neon, Supabase, Vercel PG) requires SSL; local Docker does not.
// Detected from the connection string so the same config works everywhere.
const url = process.env.DATABASE_URL || "";
const needsSsl = /sslmode=require/i.test(url) || /\.neon\.tech/i.test(url);

const base = {
  url: process.env.DATABASE_URL,
  dialect: "postgres",
  logging: false,
  ...(needsSsl
    ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
    : {}),
};

module.exports = {
  development: base,
  production: base,
};
