import { spawnSync } from "node:child_process";

process.env.DATABASE_URL ??= "postgresql://scholva:scholva@localhost:5432/scholva?schema=public";
process.env.DIRECT_URL ??= process.env.DATABASE_URL;

const result = spawnSync("prisma", ["validate", "--schema", "prisma/schema.prisma"], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

process.exit(result.status ?? 1);
