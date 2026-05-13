import { spawnSync } from "node:child_process";

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS ?? 60_000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = spawnSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "postgres",
        "pg_isready",
        "-U",
        "obraflow",
        "-d",
        "obraflow",
      ],
      { encoding: "utf8" },
    );

    if (result.status === 0) {
      console.log("PostgreSQL is ready.");
      return;
    }

    await sleep(1_000);
  }

  throw new Error(`PostgreSQL was not ready after ${timeoutMs}ms.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
