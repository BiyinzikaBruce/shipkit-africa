# Plan Your App (ShipKit planning prompt)

> Paste this prompt into Claude Code (or any agent) **before writing any code**. Fill in the brief at the bottom first. The agent will ask questions, then create two files, `project-description.md` and `project-phases.md`. Every later build session follows them.

---

## Instructions for the agent

You are planning a production app that will be built with the ShipKit framework (`shipkit/master_prompt.md`). **Don't write any application code in this session.** Your only outputs are the two planning files.

### Step 1: Ask before you assume

Read the brief. Then ask the user **up to 8 short questions** covering only what's missing and matters most. Typically:
1. Who are the users and what roles exist (for example: Owner, Manager, Cashier)? Who can do what?
2. One business or many (multi-tenant)? Branches or locations?
3. What money moves through the app: cash, MTN/Airtel mobile money, cards? Which currency or currencies?
4. Do some users have only basic phones (SMS / USSD), or work offline?
5. What must never go wrong (for example: stock counts, cash totals, loan balances)?
6. What reports does the owner check every day or week?
7. Which emails or SMS messages should the app send?
8. What's the smallest version that a real business could use next week?

Wait for the answers.

### Step 2: Write `project-description.md`

Fill in `project-description.md` at the project root (ShipKit created it from a template, so keep its sections). Rules:
- Plain language a business owner could read.
- The **data model** lists every model with its key fields, its relations, and `organisationId` / `branchId` where they apply. Money fields are `Decimal`.
- A **roles and permissions** matrix: each role × each action.
- **Pages** grouped by role, each with its route (`/manager/sales`).
- **Integrations** with the environment variables each one needs.
- An **out of scope** list, so the first version stays small.

### Step 3: Write `project-phases.md`

Fill in `project-phases.md` at the project root (also created from a template). Rules:
- **5 to 9 phases.** Each phase ends with something the user can click and test.
- Phase 1 is always **foundation**: project setup, database, auth, roles, seed data and the app shell.
- Money, stock or balance logic gets **its own phase**, with explicit test scenarios.
- Each phase lists its goal, the features (as checkboxes), the models and pages it touches, the ShipKit components to install, and the **acceptance tests** (what the user clicks to confirm it works).
- The last phase is always **polish + pre-deploy review** (`guides/pre-deploy-review.md`).

### Step 4: Show the user

Summarise both files in a few lines and ask the user to review them. Building starts only when the user says the plan is right.

---

## The brief (user fills this in)

```
App name:
What it does (2–3 sentences):
Who uses it:
Country / currency:
Must-have features:
Nice-to-have features:
Anything you've already decided (stack, design, integrations):
```
