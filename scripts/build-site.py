"""Build the docs site (index.html) from registry.json and the framework folder.
Run from the repo root:  python3 scripts/build-site.py
"""
import html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = html.escape
reg = json.load(open(os.path.join(ROOT, "registry.json")))
REG_URL = "https://biyinzikabruce.github.io/shipkit-africa/r"
GH = "https://github.com/BiyinzikaBruce/shipkit-africa"

GROUPS = [
    ("Auth & tenancy", "🔐", ["require-role", "role-gate", "scoped-query", "audit-log", "rate-limit"]),
    ("Money & payments", "💳", ["money", "momo", "webhook-verify", "use-payment-status"]),
    ("Phones & SMS", "📱", ["phone", "sms"]),
    ("Dashboard UI", "📊", ["kpi-card", "status-badge", "data-table", "empty-state", "branch-switcher", "offline-banner"]),
]
items = {i["name"]: i for i in reg["items"]}
grouped = [n for _, _, ns in GROUPS for n in ns]
assert sorted(grouped) == sorted(items), "site groups out of sync with registry.json"

GUIDES = [
    ("master_prompt.md", "Master prompt", "Stack, security, money, roles and the definition of done. Your agent follows it every session."),
    ("planning/plan-your-app.md", "Plan your app", "Turns your idea into project-description.md and project-phases.md before any code."),
    ("guides/database.md", "Database", "Prisma 7 with prisma.config.ts and the pg adapter, Decimal money, scoped queries, safe stock updates."),
    ("guides/auth-and-roles.md", "Auth & roles", "Better Auth, organisations, branches and roles, with input: false on privilege fields."),
    ("guides/payments-africa.md", "Payments", "MTN MoMo request-to-pay, Flutterwave, Paystack and Stripe, verified and idempotent."),
    ("guides/design.md", "Design", "Dashboards, POS and tables that work on a cheap phone in bright light."),
    ("guides/offline-and-sms.md", "Offline & SMS", "Outbox sync for weak internet and SMS for basic phones (Africa's Talking)."),
    ("guides/env-and-deploy.md", "Env & deploy", "Validated env vars, keys per environment, deploying to Vercel."),
    ("guides/pre-deploy-review.md", "Pre-deploy review", "A checklist your agent runs against the codebase before every launch."),
]
for path, *_ in GUIDES:
    assert os.path.exists(os.path.join(ROOT, "framework", path)), f"missing framework/{path}"

AGENTS = ["Claude Code", "Codex / AGENTS.md", "Cursor", "Gemini CLI", "GitHub Copilot", "Windsurf"]

def comp_card(n):
    i = items[n]
    cmd = f"npx shadcn@latest add {REG_URL}/{n}.json"
    deps = i.get("dependencies", [])
    tag = {"registry:lib": "lib", "registry:component": "component", "registry:hook": "hook"}[i["type"]]
    q = E(f"{n} {i['title']} {i['description']} {tag}".lower())
    src = f"{GH}/blob/main/{i['files'][0]['path']}"
    return f'''<div class="comp" data-q="{q}">
  <div class="comp-top"><span class="comp-name">{E(n)}</span><span class="kind">{tag}</span></div>
  <p>{E(i["description"])}</p>
  {"<div class='deps'>" + " ".join(f"<span class='tag'>{E(d)}</span>" for d in deps) + "</div>" if deps else ""}
  <div class="cmd"><code>{E(cmd)}</code><button class="copy" data-copy="{E(cmd)}" aria-label="Copy install command for {E(n)}">Copy</button></div>
  <a class="src" href="{src}" target="_blank" rel="noopener">View source →</a>
</div>'''

comp_html = "".join(
    f'<section class="grp"><h3>{e} {E(g)} <span class="count">{len(ns)}</span></h3><div class="grid">{"".join(comp_card(n) for n in ns)}</div></section>'
    for g, e, ns in GROUPS)
guide_html = "".join(
    f'<a class="guide" href="{GH}/blob/main/framework/{p}" target="_blank" rel="noopener"><b>{E(t)}</b><span>{E(d)}</span><code>shipkit/{E(p)}</code></a>'
    for p, t, d in GUIDES)
agents_html = "".join(f'<span class="chip">{E(a)}</span>' for a in AGENTS)
N = len(items)

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ShipKit: build production apps for African businesses with AI agents</title>
<meta name="description" content="ShipKit makes AI coding agents build production Next.js apps for African businesses: roles and branches, mobile money, SMS, weak internet, money that adds up.">
<meta property="og:title" content="ShipKit by Biyinzika Bruce">
<meta property="og:description" content="npx shipkit-africa init: a framework, {N} components and agent rules for production Next.js apps in Africa.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚢</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{{--bg:#0b0d12;--panel:#11141b;--panel2:#161a23;--border:#232835;--text:#d7dce5;--muted:#8b93a7;--head:#f4f6fb;--accent:#7c5cff;--accent2:#22d3ee;--green:#34d399;--red:#f87171;--radius:14px}}
*{{box-sizing:border-box}} html{{scroll-behavior:smooth;scroll-padding-top:76px}}
body{{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
body::before{{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;background:radial-gradient(700px 340px at 15% -5%,rgba(124,92,255,.2),transparent 70%),radial-gradient(520px 320px at 90% 0%,rgba(34,211,238,.1),transparent 70%)}}
a{{color:inherit;text-decoration:none}} code{{font-family:'JetBrains Mono',monospace}}
.top{{position:sticky;top:0;z-index:50;height:60px;display:flex;align-items:center;gap:20px;padding:0 24px;background:rgba(11,13,18,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}}
.brand{{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--head);letter-spacing:-.01em}}
.brand .logo{{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:linear-gradient(135deg,var(--accent),var(--accent2));font-size:16px}}
.nav{{display:flex;gap:4px;flex:1}} .nav a{{padding:7px 12px;border-radius:8px;font-size:14px;color:var(--muted);font-weight:500}} .nav a:hover{{color:var(--head);background:var(--panel2)}}
.btn{{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:1px solid var(--border);background:var(--panel2);color:var(--head);font:600 14px Inter,sans-serif;cursor:pointer}}
.btn:hover{{border-color:var(--accent)}} .btn.primary{{background:var(--accent);border-color:var(--accent);color:#fff}}
.wrap{{max-width:1160px;margin:0 auto;padding:0 24px 80px}}
.hero{{text-align:center;padding:76px 0 40px}}
.pill{{display:inline-block;padding:5px 14px;border-radius:999px;font-size:13px;font-weight:600;background:rgba(124,92,255,.15);color:#c4b5fd;border:1px solid rgba(124,92,255,.35)}}
h1{{font-size:clamp(38px,6.5vw,68px);line-height:1.04;letter-spacing:-.03em;margin:20px auto 18px;color:var(--head);max-width:900px}}
h1 span{{background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}}
.lead{{font-size:19px;color:var(--muted);max-width:720px;margin:0 auto 30px}}
.install{{display:inline-flex;align-items:center;gap:14px;padding:12px 12px 12px 20px;border-radius:14px;background:var(--panel);border:1px solid var(--border);font-size:17px;color:var(--head)}}
.install .dollar{{color:var(--muted)}}
.hero-cta{{display:flex;gap:12px;justify-content:center;margin-top:22px;flex-wrap:wrap}}
.by{{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:30px;color:var(--muted);font-size:14px}}
.by span{{text-align:left}} .by img{{flex-shrink:0;width:34px;height:34px;border-radius:50%;object-fit:cover}}
.stats{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:40px 0 10px}}
.stat{{padding:18px;border-radius:var(--radius);background:var(--panel);border:1px solid var(--border);text-align:center}} .stat b{{display:block;font-size:30px;color:var(--head)}} .stat small{{color:var(--muted)}}
section.s{{margin-top:84px}} h2{{font-size:clamp(26px,3.5vw,36px);color:var(--head);letter-spacing:-.02em;margin:0 0 8px}} .sub{{color:var(--muted);margin:0 0 26px;max-width:720px}}
table{{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;font-size:15px}}
th{{background:var(--panel2);color:var(--head);text-align:left;font-weight:600}} th,td{{padding:13px 16px;border-bottom:1px solid var(--border);vertical-align:top}} tr:last-child td{{border-bottom:0}}
td.bad{{color:#fca5a5}} td.good{{color:#86efac}}
.steps{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}}
.step{{padding:22px;border-radius:var(--radius);background:var(--panel);border:1px solid var(--border)}} .step .n{{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:rgba(124,92,255,.18);color:#c4b5fd;font-weight:700;margin-bottom:12px}}
.step b{{color:var(--head);display:block;margin-bottom:6px}} .step p{{margin:0 0 12px;color:var(--muted);font-size:14.5px}}
.step code{{display:block;padding:10px 12px;border-radius:8px;background:#0d1017;border:1px solid var(--border);font-size:13px;color:var(--head);white-space:pre-wrap}}
.guides{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(330px,100%),1fr));gap:14px}}
.guide{{display:flex;flex-direction:column;gap:6px;padding:18px;border-radius:var(--radius);background:var(--panel);border:1px solid var(--border);transition:.18s}}
.guide:hover{{border-color:rgba(124,92,255,.6);transform:translateY(-2px)}} .guide b{{color:var(--head)}} .guide span{{font-size:14px;color:var(--text)}} .guide code{{font-size:12px;color:var(--muted)}}
.toolbar{{display:flex;gap:12px;align-items:center;margin-bottom:6px;flex-wrap:wrap}}
.search{{flex:1;max-width:340px;padding:11px 14px;border-radius:10px;border:1px solid var(--border);background:var(--panel);color:var(--text);font:inherit;font-size:14px;outline:none}} .search:focus{{border-color:var(--accent)}}
.grp{{margin-top:30px}} .grp h3{{color:var(--head);font-size:20px;margin:0 0 14px;display:flex;align-items:center;gap:10px}}
.count{{font-size:12.5px;font-weight:600;padding:2px 10px;border-radius:999px;background:rgba(124,92,255,.15);color:#c4b5fd;border:1px solid rgba(124,92,255,.35)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(340px,100%),1fr));gap:14px}}
.comp{{min-width:0;display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:var(--radius);background:var(--panel);border:1px solid var(--border)}}
.comp-top{{display:flex;justify-content:space-between;align-items:center}} .comp-name{{font:600 15.5px 'JetBrains Mono',monospace;color:var(--head)}}
.kind{{font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--panel2);border:1px solid var(--border);color:var(--muted)}}
.comp p{{margin:0;font-size:14px;flex:1}} .deps{{display:flex;gap:6px;flex-wrap:wrap}} .tag{{font:12px 'JetBrains Mono',monospace;padding:2px 8px;border-radius:6px;background:var(--panel2);border:1px solid var(--border);color:var(--muted)}}
.cmd{{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 12px;border-radius:9px;background:#0d1017;border:1px solid var(--border)}}
.cmd code{{flex:1;font-size:11.5px;color:var(--text);overflow-x:auto;white-space:nowrap}}
.copy{{flex-shrink:0;padding:5px 10px;border-radius:7px;border:1px solid var(--border);background:var(--panel2);color:var(--muted);font:600 12px Inter,sans-serif;cursor:pointer}} .copy:hover{{color:var(--head);border-color:var(--accent)}}
.src{{font-size:13px;font-weight:600;color:var(--accent2)}}
.chips{{display:flex;gap:10px;flex-wrap:wrap}} .chip{{padding:9px 16px;border-radius:999px;background:var(--panel);border:1px solid var(--border);font-weight:500;color:var(--head)}}
.hidden{{display:none!important}} .tscroll{{overflow-x:auto;border-radius:var(--radius)}} .tscroll table{{min-width:620px}} .nav{{min-width:0}}
.cta{{margin-top:84px;padding:36px;border-radius:var(--radius);border:1px solid rgba(124,92,255,.45);background:linear-gradient(130deg,rgba(124,92,255,.18),rgba(34,211,238,.07));text-align:center}}
.cta h2{{margin-bottom:10px}}
footer{{margin-top:56px;padding-top:24px;border-top:1px solid var(--border);color:var(--muted);font-size:14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}} footer a{{color:var(--accent2)}}
@media (max-width:860px){{.steps{{grid-template-columns:1fr}}.stats{{grid-template-columns:repeat(2,1fr)}}.nav a:not(.keep){{display:none}}.install{{font-size:14px}}table{{font-size:13.5px}}th,td{{padding:10px}}}}
@media (max-width:420px){{.top{{gap:10px;padding:0 14px}}.nav a{{padding:7px 8px}}.btn{{padding:8px 12px}}.install{{gap:8px;padding:10px 10px 10px 14px;max-width:100%}}.grid,.guides{{grid-template-columns:1fr}}}}
</style>
</head>
<body>
<header class="top">
  <a class="brand" href="#"><span class="logo">🚢</span>ShipKit</a>
  <nav class="nav"><a href="#why">Why</a><a href="#start" class="keep">Start</a><a href="#framework">Framework</a><a href="#components" class="keep">Components</a></nav>
  <a class="btn" href="{GH}" target="_blank" rel="noopener">GitHub</a>
</header>
<div class="wrap">
  <section class="hero">
    <span class="pill">Open source · MIT · v0.1</span>
    <h1>Ship real business apps for <span>Africa</span> with AI agents</h1>
    <p class="lead">ShipKit makes Claude Code, Cursor and other AI agents build production Next.js apps the way African businesses need them: roles and branches, mobile money, SMS, weak internet, and money that always adds up.</p>
    <div class="install"><code><span class="dollar">$</span> npx shipkit-africa init</code><button class="copy" data-copy="npx shipkit-africa init">Copy</button></div>
    <div class="hero-cta"><a class="btn primary" href="#start">Get started</a><a class="btn" href="#components">Browse {N} components</a></div>
    <div class="by"><img src="assets/avatar.jpg" alt=""><span>Built by <b style="color:var(--head)">Biyinzika Bruce</b> · Tech Power Africa</span></div>
    <div class="stats">
      <div class="stat"><b>{len(GUIDES)}</b><small>framework files</small></div>
      <div class="stat"><b>{N}</b><small>components</small></div>
      <div class="stat"><b>{len(AGENTS)}</b><small>AI agents supported</small></div>
      <div class="stat"><b>0</b><small>CLI dependencies</small></div>
    </div>
  </section>

  <section class="s" id="why">
    <h2>Why ShipKit</h2>
    <p class="sub">AI agents write code fast, but they default to generic Silicon Valley SaaS. Business software in Kampala, Nairobi or Kigali needs different things, and the gaps cost real money.</p>
    <div class="tscroll"><table>
      <thead><tr><th>Real-world need</th><th>What agents usually do</th><th>What ShipKit makes them do</th></tr></thead>
      <tbody>
        <tr><td>Owner → Manager → Cashier, across branches</td><td class="bad">One "admin" flag, no branch scoping</td><td class="good">Role enums, server-side <code>requireRole</code>, every query scoped by organisation and branch</td></tr>
        <tr><td>MTN and Airtel mobile money</td><td class="bad">Stripe only</td><td class="good">MoMo request-to-pay, server-side verification, idempotent webhooks</td></tr>
        <tr><td>Money that must add up</td><td class="bad">Floats and client-side totals</td><td class="good"><code>Decimal</code> everywhere, server totals, transactions, no hard deletes</td></tr>
        <tr><td>Customers with basic phones</td><td class="bad">Email only</td><td class="good">SMS receipts and alerts via Africa's Talking</td></tr>
        <tr><td>3G and cheap Android phones</td><td class="bad">Heavy client bundles</td><td class="good">Server Components, offline outbox, 360px-first UI</td></tr>
        <tr><td>Security</td><td class="bad">Trusts the client</td><td class="good"><code>input: false</code> on roles, Zod everywhere, audit logs, rate limits</td></tr>
      </tbody>
    </table></div>
  </section>

  <section class="s" id="start">
    <h2>Get started in 3 steps</h2>
    <p class="sub">Works in a new or existing Next.js project. Safe to re-run: it never overwrites files you've edited.</p>
    <div class="steps">
      <div class="step"><div class="n">1</div><b>Install the framework</b><p>Adds the master prompt, guides, planning templates and rules for your agent.</p><code>npx shipkit-africa init</code></div>
      <div class="step"><div class="n">2</div><b>Plan your app</b><p>Your agent asks a few questions, then writes your project description and build phases.</p><code>"Plan my app with shipkit/planning/plan-your-app.md"</code></div>
      <div class="step"><div class="n">3</div><b>Build phase by phase</b><p>It builds one phase, runs the checks, and stops for your review before the next.</p><code>"Build phase 1"</code></div>
    </div>
  </section>

  <section class="s" id="framework">
    <h2>The framework</h2>
    <p class="sub">Plain markdown files your agent reads. <code>init</code> puts them in <code>shipkit/</code> in your project. Edit any of them, and ShipKit won't overwrite your changes.</p>
    <div class="guides">{guide_html}</div>
  </section>

  <section class="s" id="components">
    <h2>Components</h2>
    <p class="sub">{N} pieces taken from real production apps (point of sale, mobile money and trading). Each one installs into your codebase with shadcn, so you own the code.</p>
    <div class="toolbar"><input class="search" id="search" type="search" placeholder="Search components… (press /)"></div>
    {comp_html}
  </section>

  <section class="s" id="agents">
    <h2>Works with your agent</h2>
    <p class="sub"><code>init</code> writes a short rules block for each agent so it loads ShipKit every session. Use <code>--agents all</code> for every agent.</p>
    <div class="chips">{agents_html}</div>
  </section>

  <div class="cta">
    <h2>Build your next app the right way</h2>
    <p class="sub" style="margin:0 auto 20px">Free and open source. Star the repo, try it on your next project, and share what you build.</p>
    <div class="install"><code><span class="dollar">$</span> npx shipkit-africa init</code><button class="copy" data-copy="npx shipkit-africa init">Copy</button></div>
  </div>

  <footer>
    <span>© 2026 Biyinzika Bruce · Tech Power Africa · MIT License</span>
    <span><a href="{GH}" target="_blank" rel="noopener">GitHub</a> · <a href="https://biyinzikabruce.github.io/env-cheatsheet/">Env Cheatsheet</a> · <a href="https://biyinzikabruce.github.io/tools/coffee/">☕ Buy me a coffee</a></span>
  </footer>
</div>
<script>
document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {{
  const t = b.dataset.copy, done = () => {{ const o = b.textContent; b.textContent = 'Copied ✓'; setTimeout(() => b.textContent = o, 1400); }};
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
  function fallback() {{ const x = document.createElement('textarea'); x.value = t; document.body.appendChild(x); x.select(); document.execCommand('copy'); x.remove(); done(); }}
}}));
const search = document.getElementById('search'), comps = [...document.querySelectorAll('.comp')], grps = [...document.querySelectorAll('.grp')];
search.addEventListener('input', () => {{
  const q = search.value.trim().toLowerCase();
  comps.forEach(c => c.classList.toggle('hidden', q && !c.dataset.q.includes(q)));
  grps.forEach(g => g.classList.toggle('hidden', !g.querySelector('.comp:not(.hidden)')));
}});
document.addEventListener('keydown', e => {{ if (e.key === '/' && document.activeElement !== search) {{ e.preventDefault(); search.focus(); }} }});
</script>
</body>
</html>
'''
open(os.path.join(ROOT, "index.html"), "w").write(page)
print(f"index.html built: {N} components, {len(GUIDES)} framework files")
