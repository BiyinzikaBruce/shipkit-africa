// Copies ../framework into ./framework so the npm package is self-contained.
// The copy is generated: gitignored, never edit it by hand.
import { cpSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "framework");
const dest = join(here, "..", "framework");
if (!existsSync(src)) throw new Error(`framework source not found at ${src}`);
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("bundled framework →", dest);
