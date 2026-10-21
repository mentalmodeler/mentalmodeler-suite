# Vite 8 / Vitest 5 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `mentalmodeler-suite` from Vite 4.5 / Vitest 0.34 / Node 18 to the same Vite 8 / Vitest 5 / Node 24 toolchain `mentalmodeler-js` and `mm-modules` already run, closing the open Dependabot alerts that the upgrade can fix.

**Architecture:** Toolchain-only change; no app code should change. Vite and Vitest must move together (Vitest 0.34 bundles its own Vite 4). Work happens on one branch, one PR, one commit per task, so each step can be reverted alone. `mentalmodeler-js`'s `2026-10-06-vite-migration.md` plan is the precedent.

**Tech Stack:** Vite 8 (Rolldown), Vitest 5, `@vitejs/plugin-react` 6, jsdom 30, Node 24, React 18, MUI 5, Redux Toolkit.

**Spec:** No separate spec. Scope is the "Vite/Vitest major upgrade in `-suite`" item in `../BACKLOG.md` plus the 12 open Dependabot alerts on `mentalmodeler/mentalmodeler-suite`.

## Global Constraints

- Target versions (current as of 2026-10-20): `vite@^8.3.4`, `vitest@^5.0.5`, `@vitejs/plugin-react@^6.1.2`, `jsdom@^30.1.3`.
- Node pin: `.nvmrc` = `24` (Vite 8 needs `^20.19 || >=22.12`, Vitest 5 needs `^22.12 || ^24 || >=26`).
- Production `base` stays `/mentalmodeler-suite/`; dev server stays `host: 'localhost'`, `port: 8081` (the localhost binding came from PR #7 and must not regress).
- `mentalmodeler-js` and `mm-modules` stay linked via `file:../...`; both must be built/installed (`-js`: `npm run build`) before `npm install` here.
- No application source changes unless a test or the build proves one is needed; if one is, it goes in its own commit with the reason in the message.
- `package.json` already has `"type": "module"`, so `vite.config.js` is already ESM; do not rename it.
- Out of scope: MUI/React upgrades, chunk-size warning, Google Font support.

## Baseline (measured on `main`, 2026-10-20, Node v24.18.0)

| Check | Result |
|---|---|
| `npm test` | 8 files, 79 tests, all pass |
| `npm run build` | succeeds; `dist/assets/index-*.js` 1,193.32 kB (361.79 kB gzip), CSS 24.51 kB |
| `npm run lint` | was failing with 53 problems on `main`; fixed in the `lint-clean` PR, so the bar is **0 problems** (`--max-warnings 0`) |
| `npm audit` | 12 vulnerabilities (2 critical, 9 high, 1 moderate) |

## Review Focus

- **Linked packages resolve everywhere.** `mentalmodeler-js` and `mm-modules` are symlinked `file:` deps; Vite 8's bundler and Vitest 5 must resolve and transform them in dev, build and test. `mm-modules` has ES `import` syntax in `.js` with no `"type": "module"`.
- **Base path survives.** The built `dist/index.html` must reference `/mentalmodeler-suite/assets/...`, or the GitHub Pages deploy breaks.
- **CJS-only deps still bundle.** `redux-persist/lib/storage/session`, `papaparse`, `write-excel-file` and `mathjs` (via `mm-modules`) are CJS or mixed; a build can succeed but fail at runtime.
- **`window.html2canvas` still gets set.** `src/services/print.js` relies on the global `mentalmodeler-js` sets on import; tree-shaking changes could drop that side effect.
- **Emotion theme in tests.** CLAUDE.md says MUI's `ThemeProvider` does not fill Emotion's context under Vitest; Vitest 5 may change that, so `Tabs.test.jsx` and `Matrix.test.jsx` are the likeliest to break.
- **Dev server stays on localhost.** Vite 8 must still bind `localhost:8081` only, not `0.0.0.0`.

---

### Task 1: Branch and Node 24 pin

**Files:**
- Modify: `.nvmrc` (`lts/hydrogen` -> `24`)
- Modify: `CLAUDE.md` (the "Node version is pinned via `.nvmrc` (`lts/hydrogen`, i.e. Node 18)" sentence)

**Interfaces:**
- Produces: a branch `vite-8-vitest-5` off up-to-date `main`, on which every later task commits.

- [ ] **Step 1: Create the branch**

```bash
git checkout main && git pull && git checkout -b vite-8-vitest-5
```

- [ ] **Step 2: Set `.nvmrc` to `24` and update the CLAUDE.md sentence to say Node 24**

- [ ] **Step 3: Verify the old toolchain is still green on Node 24**

Run: `node -v && npm test`
Expected: `v24.x`, 79 tests pass. (This proves the Node bump is independent of the Vite bump.)

- [ ] **Step 4: Commit**

```bash
git add .nvmrc CLAUDE.md
git commit -m "Pin Node 24 via .nvmrc"
```

### Task 2: Upgrade Vite, Vitest, plugin-react and jsdom together

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `vite.config.js` (only if Vite 8 requires it)
- Modify: `.eslintrc.cjs` (only if the `vitest` globals override needs adjusting)
- Test: existing `src/**/*.test.js(x)`, no new tests

**Interfaces:**
- Consumes: the Task 1 branch.
- Produces: a lockfile at the target versions with 79/79 tests passing and a successful `npm run build`.

- [ ] **Step 1: Make sure `-js` is built so the `file:` link installs**

Run: `(cd ../mentalmodeler-js && npm run build)`
Expected: exits 0; `../mentalmodeler-js/dist/mentalmodeler-js.es.js` and `.css` exist.

- [ ] **Step 2: Install the target versions**

Run: `npm install -D vite@^8.3.4 vitest@^5.0.5 @vitejs/plugin-react@^6.1.2 jsdom@^30.1.3`
Expected: exits 0 with no peer-dependency errors. `npm ls vite vitest` shows 8.3.x and 5.0.x with a single deduped `vite`.

- [ ] **Step 3: Run the tests and fix only what the upgrade broke**

Run: `npm test`
Expected: 8 files, 79 tests pass. If `Tabs.test.jsx` or `Matrix.test.jsx` fail on theme lookups, adjust the test's provider setup (keep the Emotion `ThemeProvider` wrapper unless Vitest 5 makes it redundant, in which case remove it and the matching CLAUDE.md note). If `loadDemoModel.test.js` cannot resolve `mm-modules`, check `resolve.preserveSymlinks` and the `exports` map before changing anything else.

- [ ] **Step 4: Run the build and fix only what the upgrade broke**

Run: `npm run build`
Expected: exits 0 with no new warnings besides the existing chunk-size one. If the config needs changes, apply the minimum (Vite 8 renames `build.rollupOptions` to `build.rolldownOptions`; the current config sets neither).

- [ ] **Step 5: Check lint did not get worse**

Run: `npm run lint 2>&1 | tail -3`
Expected: no output and exit code 0 (requires the `lint-clean` PR to be merged first).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js .eslintrc.cjs src
git commit -m "Upgrade to Vite 8, Vitest 5, plugin-react 6, jsdom 30"
```

### Task 3: Verify the build output and the running app

**Files:**
- Modify: none expected (fix-forward commits only if a check fails)

**Interfaces:**
- Consumes: Task 2's lockfile and a clean `dist/` from `npm run build`.

- [ ] **Step 1: Base path is intact**

Run: `grep -o '/mentalmodeler-suite/assets/[^"]*' dist/index.html`
Expected: at least one JS and one CSS URL. Zero matches means the deploy would break.

- [ ] **Step 2: `html2canvas` global is still wired**

Run: `grep -c 'html2canvas' dist/assets/*.js`
Expected: a non-zero count in the main bundle.

- [ ] **Step 3: Bundle size did not balloon**

Run: `ls -l dist/assets/*.js`
Expected: within roughly 20% of the 1,193 kB baseline. A bigger jump means a dependency stopped tree-shaking or got bundled twice; investigate before continuing.

- [ ] **Step 4: Dev server binds localhost only**

Run: `npm run dev & sleep 4; lsof -nP -iTCP:8081 -sTCP:LISTEN; kill %1`
Expected: the listener address is `127.0.0.1` or `[::1]`, not `*`.

- [ ] **Step 5: Hand a browser check to the user**

Ask the user to run `npm run dev` and, with the Fire demo model (`?demo`), confirm: the concept map renders, Matrix/Metrics/Scenario tabs open, Export CSV downloads, Print produces output, and the console shows no errors. Also `npm run build && npm run preview` and confirm the app loads under `/mentalmodeler-suite/`. Do not claim these pass without the user's report.

### Task 4: Alerts, docs and PR

**Files:**
- Modify: `CLAUDE.md` (Vitest-pin paragraph, Emotion test note if now stale, Node line from Task 1)
- Modify: `../BACKLOG.md` (close the upgrade item; record what happened to each alert)
- Modify: `docs/porting-roadmap.md` only if it mentions the Vite 4 pin

- [ ] **Step 1: Re-audit and compare to the 12 alerts**

Run: `npm audit --json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['metadata']['vulnerabilities'])"`
Expected: the `vite`, `esbuild`, `vitest`, `tinypool` findings are gone. Still expected to remain, because they come from ESLint/`prettier-eslint` and from `mentalmodeler-js`'s `npm-run-all`, not from Vite: `minimatch` (alert #33) and the `@typescript-eslint/*` findings. For each remaining finding, run `npm ls <pkg>` to confirm its parent, then decide with the user: leave open, `npm audit fix`, or dismiss as dev-only tolerable risk.

- [ ] **Step 2: Rewrite the stale CLAUDE.md lines**

Remove "Vitest is pinned to 0.34.x because it is the last line that shares this repo's Vite 4" and, only if Task 2 proved it, the Emotion `ThemeProvider` note. State the new versions instead.

- [ ] **Step 3: Update `../BACKLOG.md`**

Strike the "Vite/Vitest major upgrade in `-suite`" item and the Dependabot item; list any alert still open and why.

- [ ] **Step 4: Commit, push, open the PR**

```bash
git add CLAUDE.md docs
git commit -m "Docs: Vite 8 / Vitest 5 / Node 24"
git push -u origin vite-8-vitest-5
gh pr create --base main --title "Upgrade to Vite 8, Vitest 5, Node 24"
```
PR body: summary, the baseline table with before/after numbers, the Task 3 browser-check result, and which alerts should auto-close on merge.

- [ ] **Step 5: After the user merges, confirm the alerts closed**

Run: `gh api repos/mentalmodeler/mentalmodeler-suite/dependabot/alerts -q '[.[] | select(.state=="open")] | length'`
Expected: only the alerts agreed in Task 4 Step 1 remain open (read-only check; GitHub closes fixed alerts itself after rescanning, which can take a few minutes).

## Rollback

Nothing deploys from this branch until the user runs `npm run deploy`. If Task 2 or 3 turns up a blocker that is not quickly fixable, abandon the branch; `main` is untouched. Do not run `npm run deploy` as part of this plan.
