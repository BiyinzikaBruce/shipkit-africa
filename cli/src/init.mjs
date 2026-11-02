import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENTS, DEFAULT_AGENTS, DETECT, END, RULES_BODY, START } from "./agents.mjs";

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const FRAMEWORK_DIR = join(PKG_ROOT, "framework");
const MANIFEST = "shipkit/.manifest.json";

const sha = (s) => createHash("sha256").update(s).digest("hex");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

/** Insert or replace the ShipKit block in a markdown rules file, keeping the user's own content. */
export function upsertBlock(existing, body) {
  const block = `${START}\n${body.trim()}\n${END}`;
  if (existing === null) return `${block}\n`;
  const s = existing.indexOf(START);
  const e = existing.indexOf(END);
  if (s !== -1 && e !== -1 && e > s) return existing.slice(0, s) + block + existing.slice(e + END.length);
  return `${existing.replace(/\s*$/, "")}\n\n${block}\n`;
}

export function resolveAgents(cwd, requested) {
  if (requested === "all") return Object.keys(AGENTS);
  if (requested) {
    const list = requested.split(",").map((a) => a.trim()).filter(Boolean);
    const unknown = list.filter((a) => !AGENTS[a]);
    if (unknown.length) throw new Error(`Unknown agent(s): ${unknown.join(", ")}. Choose from: ${Object.keys(AGENTS).join(", ")}, all`);
    return list;
  }
  const detected = Object.entries(DETECT)
    .filter(([, paths]) => paths.some((p) => existsSync(join(cwd, p))))
    .map(([a]) => a);
  return [...new Set([...DEFAULT_AGENTS, ...detected])];
}

/**
 * Install ShipKit into `cwd`.
 * - Framework files go to ./shipkit/. Files you edited are never overwritten (unless force).
 * - project-description.md / project-phases.md are created once, never overwritten.
 * - Agent rule files get a marked ShipKit block. Your own content around it is kept.
 */
export function init({ cwd = process.cwd(), agents, force = false, log = console.log } = {}) {
  if (!existsSync(FRAMEWORK_DIR)) throw new Error("Framework files missing from the package (run `npm run bundle`).");
  const manifestPath = join(cwd, MANIFEST);
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { files: {} };
  const result = { created: [], updated: [], skipped: [], unchanged: [] };

  // 1. Framework → ./shipkit/
  for (const src of walk(FRAMEWORK_DIR)) {
    const rel = relative(FRAMEWORK_DIR, src).split(sep).join("/");
    if (rel.startsWith("planning/templates/")) continue; // handled below
    const destRel = `shipkit/${rel}`;
    const dest = join(cwd, destRel);
    const content = readFileSync(src, "utf8");
    if (!existsSync(dest)) {
      write(dest, content);
      result.created.push(destRel);
    } else {
      const current = readFileSync(dest, "utf8");
      if (current === content) result.unchanged.push(destRel);
      else if (force || manifest.files[destRel] === sha(current)) {
        write(dest, content);
        result.updated.push(destRel);
      } else {
        result.skipped.push(`${destRel} (you edited it, use --force to replace)`);
        continue;
      }
    }
    manifest.files[destRel] = sha(content);
  }

  // 2. Planning files at the project root, created once
  for (const name of ["project-description.md", "project-phases.md"]) {
    const dest = join(cwd, name);
    if (existsSync(dest)) result.skipped.push(`${name} (already exists)`);
    else {
      write(dest, readFileSync(join(FRAMEWORK_DIR, "planning", "templates", name), "utf8"));
      result.created.push(name);
    }
  }

  // 3. Agent rules
  for (const key of resolveAgents(cwd, agents)) {
    const agent = AGENTS[key];
    const dest = join(cwd, agent.path);
    const existing = existsSync(dest) ? readFileSync(dest, "utf8") : null;
    const next = agent.kind === "block" ? upsertBlock(existing, RULES_BODY) : agent.content;
    if (existing === next) result.unchanged.push(agent.path);
    else {
      write(dest, next);
      (existing === null ? result.created : result.updated).push(`${agent.path} (${agent.label})`);
    }
  }

  write(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  for (const f of result.created) log(`  + ${f}`);
  for (const f of result.updated) log(`  ~ ${f}`);
  for (const f of result.skipped) log(`  ! skipped ${f}`);
  return result;
}
