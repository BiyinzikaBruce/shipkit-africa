#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { init } from "../src/init.mjs";
import { AGENTS } from "../src/agents.mjs";

const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"));
const REGISTRY = "https://biyinzikabruce.github.io/shipkit-africa/r";
const args = process.argv.slice(2);
const cmd = args[0] && !args[0].startsWith("-") ? args[0] : "help";
const flag = (name) => {
  const i = args.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i === -1) return undefined;
  const a = args[i];
  return a.includes("=") ? a.split("=").slice(1).join("=") : args[i + 1] && !args[i + 1].startsWith("-") ? args[i + 1] : true;
};

const COMPONENTS = ["money", "phone", "scoped-query", "require-role", "audit-log", "webhook-verify", "momo", "sms", "rate-limit",
  "role-gate", "status-badge", "kpi-card", "empty-state", "offline-banner", "branch-switcher", "data-table", "use-payment-status"];

function help() {
  console.log(`
  ShipKit v${pkg.version}: build production Next.js apps for African businesses with AI agents.

  Usage
    npx shipkit-africa init                 Install the framework + agent rules in this project
    npx shipkit-africa init --agents all    Rules for every supported agent
    npx shipkit-africa init --agents claude,cursor
    npx shipkit-africa init --force         Also replace framework files you edited
    npx shipkit-africa components           List components and their install commands
    npx shipkit-africa --version

  Agents: ${Object.keys(AGENTS).join(", ")}
  Docs:   ${pkg.homepage}
`);
}

try {
  if (args.includes("--version") || args.includes("-v")) console.log(pkg.version);
  else if (cmd === "init") {
    console.log(`\n  ShipKit v${pkg.version}: installing into ${process.cwd()}\n`);
    const agents = flag("agents");
    const r = init({ agents: typeof agents === "string" ? agents : undefined, force: Boolean(flag("force")) });
    const n = r.created.length + r.updated.length;
    console.log(`\n  Done: ${n} file${n === 1 ? "" : "s"} written, ${r.unchanged.length} already up to date, ${r.skipped.length} skipped.`);
    console.log(`
  Next steps
    1. Open your AI agent in this folder.
    2. Ask it: "Plan my app with shipkit/planning/plan-your-app.md" and fill in the brief.
    3. Review project-description.md + project-phases.md, then: "Build phase 1".
`);
  } else if (cmd === "components") {
    console.log(`\n  ShipKit components: install with shadcn\n`);
    for (const c of COMPONENTS) console.log(`  npx shadcn@latest add ${REGISTRY}/${c}.json`);
    console.log("");
  } else help();
} catch (err) {
  console.error(`\n  ✖ ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
}
