import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const lockPath = path.join(root, "docs/design-4188/phase0/source-lock.json");
const lock = JSON.parse(await readFile(lockPath, "utf8"));
const entries = [...Object.entries(lock.files), ...Object.entries(lock.assets)];
const mismatches = [];

for (const [relativePath, expected] of entries) {
  const absolutePath = path.join(root, lock.sourceRoot, relativePath);
  try {
    const contents = await readFile(absolutePath);
    const actual = createHash("sha256").update(contents).digest("hex");
    if (actual !== expected) mismatches.push({ path: relativePath, expected, actual });
  } catch (error) {
    mismatches.push({ path: relativePath, expected, actual: `unreadable: ${error.message}` });
  }
}

if (mismatches.length > 0) {
  console.error(JSON.stringify({ ok: false, mismatches }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, checked: entries.length, sourceRoot: lock.sourceRoot }, null, 2));
}
