import { spawnSync } from "node:child_process";

import pg from "pg";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required before starting the app.");
}

run("npx", ["prisma", "migrate", "deploy"]);

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  const result = await client.query('SELECT COUNT(*)::int AS count FROM "Raffle"');
  const raffleCount = Number(result.rows[0]?.count ?? 0);

  if (raffleCount === 0) {
    run("npm", ["run", "db:seed"]);
  } else {
    console.log("Database already has raffle data. Seed skipped.");
  }
} finally {
  await client.end();
}
