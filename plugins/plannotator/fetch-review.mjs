#!/usr/bin/env node
// Reads the completed PlanNotator result for this exact work item.

import { readFileSync } from "node:fs";
import { join } from "node:path";

try {
  const req = JSON.parse(await stdin());
  const result = readResult(req);
  process.stdout.write(JSON.stringify(result));
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
}

function readResult(req) {
  const workItemId = String(req.workItemId || "").trim();
  const projectRootDir = String(req.projectRootDir || "").trim();
  if (!workItemId) throw new Error("workItemId required");
  if (!projectRootDir) throw new Error("projectRootDir required");

  const resultPath = join(projectRootDir, `.plannotator-review-${encodeURIComponent(workItemId)}.json`);
  let result;
  try {
    result = JSON.parse(readFileSync(resultPath, "utf8"));
  } catch {
    throw new Error(`No PlanNotator review result found at ${resultPath}`);
  }

  if (result.workItemId && result.workItemId !== workItemId) {
    throw new Error(`PlanNotator result is for ${result.workItemId}, not ${workItemId}`);
  }
  if (result.passed !== true && result.passed !== false) {
    throw new Error("PlanNotator result must contain passed=true or passed=false");
  }

  const status = result.passed ? "passed" : "failed";
  const defaultNote = result.passed ? "PlanNotator review passed." : "PlanNotator review found issues.";
  return {
    status,
    note: typeof result.summary === "string" && result.summary.trim() ? result.summary : defaultNote,
  };
}

function stdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}
