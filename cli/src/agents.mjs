// Where each AI coding tool reads its project rules.
// The rules block is short: it points the agent at shipkit/master_prompt.md.

export const RULES_BODY = `## ShipKit

This project is built with **ShipKit** (https://biyinzikabruce.github.io/shipkit-africa/).

Before writing or changing code:
1. Read \`shipkit/master_prompt.md\` and follow it. Its rules override your defaults.
2. Read \`project-description.md\` and \`project-phases.md\`. If they are still blank templates, run the planning prompt in \`shipkit/planning/plan-your-app.md\` first. Don't write app code before the plan exists.
3. Check \`shipkit/components.md\` before building auth guards, money/phone helpers, payments, audit logs, tables or dashboard cards. Install the matching component instead.
4. Load guides from \`shipkit/guides/\` only when the task needs them.
5. Build one phase at a time. Stop after each phase and wait for the user.
`;

export const START = "<!-- shipkit:start -->";
export const END = "<!-- shipkit:end -->";

export const AGENTS = {
  claude: { label: "Claude Code", path: "CLAUDE.md", kind: "block" },
  agents: { label: "Codex / AGENTS.md agents", path: "AGENTS.md", kind: "block" },
  cursor: {
    label: "Cursor",
    path: ".cursor/rules/shipkit.mdc",
    kind: "file",
    content: `---\ndescription: ShipKit framework rules (always on)\nalwaysApply: true\n---\n\n${RULES_BODY}`,
  },
  gemini: { label: "Gemini CLI", path: "GEMINI.md", kind: "block" },
  copilot: { label: "GitHub Copilot", path: ".github/copilot-instructions.md", kind: "block" },
  windsurf: { label: "Windsurf", path: ".windsurf/rules/shipkit.md", kind: "file", content: RULES_BODY },
};

export const DEFAULT_AGENTS = ["claude", "agents"];

/** Agents whose config folder already exists in the project. */
export const DETECT = {
  cursor: [".cursor"],
  windsurf: [".windsurf"],
  copilot: [".github/copilot-instructions.md"],
  gemini: ["GEMINI.md"],
};
