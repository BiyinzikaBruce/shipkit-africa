# shipkit-africa

The installer for **[ShipKit](https://biyinzikabruce.github.io/shipkit-africa/)**, a framework that makes AI coding agents (Claude Code, Cursor, Codex, Gemini CLI, Copilot, Windsurf) build **production Next.js apps for African businesses**: roles and branches, mobile money, SMS and weak internet.

```bash
npx shipkit-africa init
```

## What `init` does

| Writes | Purpose |
|---|---|
| `shipkit/master_prompt.md` | Coding standards your agent follows: stack, security, money, roles |
| `shipkit/guides/*.md` | Database (Prisma 7), auth and roles (Better Auth), payments (MoMo, Flutterwave, Paystack, Stripe), design, offline and SMS, env and deploy, pre-deploy review |
| `shipkit/planning/plan-your-app.md` | Prompt that turns your idea into a plan |
| `shipkit/components.md` | Index of installable ShipKit components |
| `project-description.md`, `project-phases.md` | Planning templates (created once, never overwritten) |
| `CLAUDE.md`, `AGENTS.md` (+ detected agents) | A short rules block so your agent loads ShipKit every session |

Safe to re-run. It **never overwrites files you edited** (it tracks them in `shipkit/.manifest.json`) and keeps your own content in `CLAUDE.md` / `AGENTS.md`. Only the marked ShipKit block changes. No dependencies, works offline.

## Options

```bash
npx shipkit-africa init --agents all              # claude, agents, cursor, gemini, copilot, windsurf
npx shipkit-africa init --agents claude,cursor
npx shipkit-africa init --force                   # also replace framework files you edited
npx shipkit-africa components                     # list component install commands
```

## License

MIT © 2026 Biyinzika Bruce
