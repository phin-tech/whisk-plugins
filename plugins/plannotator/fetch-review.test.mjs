import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "fetch-review.mjs");

const root = mkdtempSync(join(tmpdir(), "plannotator-review-"));
try {
  writeFileSync(
    join(root, ".plannotator-review-wi_01.json"),
    JSON.stringify({ workItemId: "wi_01", passed: false, summary: "Needs changes" }),
  );

  const failed = run({ workItemId: "wi_01", projectRootDir: root });
  assert.deepEqual(failed, { status: "failed", note: "Needs changes" });

  writeFileSync(join(root, ".plannotator-review-wi_02.json"), JSON.stringify({ workItemId: "wi_02" }));
  assert.throws(() => run({ workItemId: "wi_02", projectRootDir: root }), /passed=true or passed=false/);
} finally {
  rmSync(root, { recursive: true, force: true });
}

function run(req) {
  return JSON.parse(
    execFileSync("node", [script], {
      input: JSON.stringify(req),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }),
  );
}
