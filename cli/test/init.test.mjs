import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { init, upsertBlock, resolveAgents } from "../src/init.mjs";
import { START, END } from "../src/agents.mjs";

const quiet = () => {};
const tmp = () => mkdtempSync(join(tmpdir(), "shipkit-"));
const read = (dir, p) => readFileSync(join(dir, p), "utf8");

test("fresh install creates framework, planning files and default agent rules", () => {
  const dir = tmp();
  const r = init({ cwd: dir, log: quiet });
  for (const p of ["shipkit/master_prompt.md", "shipkit/components.md", "shipkit/guides/database.md", "shipkit/guides/auth-and-roles.md",
    "shipkit/guides/payments-africa.md", "shipkit/planning/plan-your-app.md", "project-description.md", "project-phases.md", "CLAUDE.md", "AGENTS.md", "shipkit/.manifest.json"]) {
    assert.ok(existsSync(join(dir, p)), `missing ${p}`);
  }
  assert.ok(!existsSync(join(dir, "shipkit/planning/templates")), "templates should not be copied into shipkit/");
  assert.ok(read(dir, "CLAUDE.md").includes("shipkit/master_prompt.md"));
  assert.equal(r.skipped.length, 0);
});

test("re-running is idempotent", () => {
  const dir = tmp();
  init({ cwd: dir, log: quiet });
  const r = init({ cwd: dir, log: quiet });
  assert.equal(r.created.length, 0);
  assert.equal(r.updated.length, 0);
  assert.deepEqual(r.skipped.sort(), ["project-description.md (already exists)", "project-phases.md (already exists)"]);
});

test("never overwrites a framework file the user edited, unless --force", () => {
  const dir = tmp();
  init({ cwd: dir, log: quiet });
  writeFileSync(join(dir, "shipkit/guides/design.md"), "# My own design rules\n");
  const r = init({ cwd: dir, log: quiet });
  assert.equal(read(dir, "shipkit/guides/design.md"), "# My own design rules\n");
  assert.ok(r.skipped.some((s) => s.startsWith("shipkit/guides/design.md")));
  init({ cwd: dir, force: true, log: quiet });
  assert.notEqual(read(dir, "shipkit/guides/design.md"), "# My own design rules\n");
});

test("never overwrites the user's planning files", () => {
  const dir = tmp();
  writeFileSync(join(dir, "project-description.md"), "# My app\n");
  init({ cwd: dir, log: quiet });
  assert.equal(read(dir, "project-description.md"), "# My app\n");
});

test("keeps the user's own CLAUDE.md content and updates only the ShipKit block", () => {
  const dir = tmp();
  writeFileSync(join(dir, "CLAUDE.md"), "# My project rules\n\nUse tabs.\n");
  init({ cwd: dir, log: quiet });
  init({ cwd: dir, log: quiet });
  const c = read(dir, "CLAUDE.md");
  assert.ok(c.startsWith("# My project rules\n\nUse tabs.\n"));
  assert.equal(c.split(START).length - 1, 1, "exactly one ShipKit block");
});

test("upsertBlock replaces an existing block in place", () => {
  const before = `top\n${START}\nold\n${END}\nbottom\n`;
  assert.equal(upsertBlock(before, "new"), `top\n${START}\nnew\n${END}\nbottom\n`);
  assert.equal(upsertBlock(null, "x"), `${START}\nx\n${END}\n`);
});

test("agent selection: defaults, detection, explicit, all, unknown", () => {
  const dir = tmp();
  assert.deepEqual(resolveAgents(dir), ["claude", "agents"]);
  mkdirSync(join(dir, ".cursor"));
  assert.deepEqual(resolveAgents(dir), ["claude", "agents", "cursor"]);
  assert.deepEqual(resolveAgents(dir, "cursor"), ["cursor"]);
  assert.equal(resolveAgents(dir, "all").length, 6);
  assert.throws(() => resolveAgents(dir, "notepad"), /Unknown agent/);
});

test("all agents write their files", () => {
  const dir = tmp();
  init({ cwd: dir, agents: "all", log: quiet });
  for (const p of ["CLAUDE.md", "AGENTS.md", ".cursor/rules/shipkit.mdc", "GEMINI.md", ".github/copilot-instructions.md", ".windsurf/rules/shipkit.md"]) {
    assert.ok(existsSync(join(dir, p)), `missing ${p}`);
  }
  assert.ok(read(dir, ".cursor/rules/shipkit.mdc").startsWith("---\ndescription:"));
  assert.ok(read(dir, ".cursor/rules/shipkit.mdc").includes("alwaysApply: true"));
});

test("CLI binary: init, components, version", () => {
  const dir = tmp();
  const bin = join(import.meta.dirname ?? new URL(".", import.meta.url).pathname, "..", "bin", "shipkit.mjs");
  const out = execFileSync("node", [bin, "init"], { cwd: dir, encoding: "utf8" });
  assert.match(out, /Done: \d+ files written/);
  assert.ok(existsSync(join(dir, "shipkit/master_prompt.md")));
  assert.match(execFileSync("node", [bin, "components"], { encoding: "utf8" }), /shipkit-africa\/r\/momo\.json/);
  assert.match(execFileSync("node", [bin, "--version"], { encoding: "utf8" }), /^\d+\.\d+\.\d+/);
  assert.throws(() => execFileSync("node", [bin, "init", "--agents", "bogus"], { cwd: dir, stdio: "pipe" }));
});
