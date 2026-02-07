/** @type {import("drizzle-kit").Config} */
module.exports = {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:"postgresql://dayframe:dayframe@localhost:5432/dayframe",
  },
};
