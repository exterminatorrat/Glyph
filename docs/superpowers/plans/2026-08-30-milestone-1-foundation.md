# Glyph Milestone 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reproducible, local-only Next.js and TypeScript foundation with minimal linting, type-checking, Node-side testing, and build commands, without beginning Glyph's carrier, fingerprint, persistence, or product workflows.

**Architecture:** Milestone 1 creates only the executable shell of the approved research-first modular monolith: an App Router root page, strict TypeScript configuration, ESLint, and a Node-environment Vitest harness. It creates no domain modules or speculative directories. The shell remains an unauthenticated internal research prototype bound explicitly to loopback during development; research functionality begins only after this milestone is complete.

**Tech Stack:** Stable Next.js selected at execution time, React, React DOM, TypeScript, pnpm, ESLint with the matching Next.js configuration, and Vitest. Tailwind CSS is intentionally absent because neither the minimal shell nor the Milestone 2 Node-side carrier spike requires it.

**Spec:** The implementation must preserve the decisions in [`AGENTS.md`](../../../AGENTS.md), [`docs/PRODUCT.md`](../../PRODUCT.md), [`docs/MVP_SPEC.md`](../../MVP_SPEC.md), [`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md), [`docs/SECURITY.md`](../../SECURITY.md), [`docs/TESTING.md`](../../TESTING.md), and [`docs/EXPERIMENTS.md`](../../EXPERIMENTS.md). These remain authoritative when this plan is executed.

## Global Constraints

- This is Milestone 1 only. Do not generate DOCX files, add `w:vanish`, define research markers, implement `FingerprintEngine` or ExactCanary, configure Supabase/Postgres, add Protect or Analyze workflows, build an evaluation harness, or run research experiments.
- Keep Glyph an **INTERNAL RESEARCH PROTOTYPE**. Do not deploy, configure hosting, create a public tunnel, bind the development server to a public interface, or add authentication flows.
- No actual student submission, student identifier, school data, secret, or environment credential may enter source files, tests, fixtures, logs, documentation examples, or Git.
- Software checks prove software behavior only. They do not establish assignment-specific marker detection, marker-exposure evidence, prompt reuse, AI authorship, direct AI ingestion, student intent, or academic misconduct.
- Do not create empty future directories, routes, interfaces, or modules. Each new path below is required and fully used in Milestone 1.
- Use pnpm from the start. Do not scaffold with npm and convert afterward.
- Do not install or enable global tooling. If the local Node.js or pnpm installation is missing or incompatible with the selected stable toolchain, stop and report the exact incompatibility.
- Resolve dependency versions only when executing this milestone. The resulting `package.json` and committed `pnpm-lock.yaml` record the versions selected then; this plan does not freeze versions in advance.
- Before installing, re-check the current official [Next.js installation requirements](https://nextjs.org/docs/app/getting-started/installation), [Next.js ESLint guidance](https://nextjs.org/docs/app/api-reference/config/eslint), [Next.js CLI commands](https://nextjs.org/docs/app/api-reference/cli/next), [TypeScript guidance](https://nextjs.org/docs/app/api-reference/config/typescript), [Vitest configuration](https://vitest.dev/config/), and [pnpm install behavior](https://pnpm.io/cli/install).
- Preserve Milestone 0 history. Do not change Git identity or global Git configuration. Use one coherent Milestone 1 commit after the complete verification pass.

---

## Task 1: Establish the package and toolchain foundation

**Files:**

- Create: `.gitignore` — excludes only dependency output, framework/test output, local environment files, and common machine-local debris.
- Create: `package.json` — owns the five authoritative project commands and the direct dependency declarations.
- Create: `pnpm-lock.yaml` — records the dependency graph resolved by pnpm.
- Create: `tsconfig.json` — enables strict TypeScript, Next.js integration, and the `@/*` source alias.
- Create: `eslint.config.mjs` — provides the minimal current flat ESLint configuration for Next.js and TypeScript.
- Create: `vitest.config.ts` — establishes a Node test environment and mirrors the TypeScript source alias.

### Step 1: Confirm the repository boundary and local tools

- [ ] Run:

  ```bash
  pwd -P
  git status --short --branch
  git log --oneline --decorate -5
  find . -maxdepth 4 -type f -not -path './.git/*' | sort
  node --version
  pnpm --version
  ```

  Expected outcome: the physical working directory is `/Users/harryjin/Glyph`; Milestone 0 is present in history; there is no application scaffold; and the only permissible uncommitted file is this approved implementation plan. At planning time the machine reported Node.js `v26.7.0` and pnpm `11.19.0`, but execution must trust the fresh command output.

- [ ] If another tracked or untracked change is present, stop and report its exact path before editing. Do not overwrite or absorb unrelated work.

### Step 2: Verify the current stable compatibility contract

- [ ] Read the official sources linked under Global Constraints, then query the package metadata with the existing pnpm installation:

  ```bash
  pnpm view next@latest version engines peerDependencies --json
  pnpm view react@latest version engines --json
  pnpm view react-dom@latest version engines peerDependencies --json
  pnpm view eslint@latest version engines --json
  pnpm view eslint-config-next@latest version engines peerDependencies --json
  pnpm view vitest@latest version engines peerDependencies --json
  ```

  Expected outcome: one mutually compatible stable set exists and the installed Node.js and pnpm versions satisfy every declared requirement. Confirm that the selected Next.js release supports App Router, `next dev --hostname`, `next typegen`, and ESLint CLI usage.

- [ ] If those requirements are not jointly satisfied, stop before creating package files and report the package metadata and failed constraint. Do not install Node.js, pnpm, Corepack shims, or global packages.

### Step 3: Create the manifest and ignore rules

- [ ] Create `.gitignore` with exactly this initial scope:

  ```gitignore
  node_modules/
  .next/
  out/
  coverage/
  .vitest/
  *.tsbuildinfo
  next-env.d.ts

  .env
  .env.local
  .env.development.local
  .env.test.local
  .env.production.local

  .DS_Store
  pnpm-debug.log*
  ```

  Expected outcome: generated artifacts and local credentials are excluded without ignoring source, documentation, research fixtures, or editor configuration broadly.

- [ ] Create `package.json` with this controlled starting content:

  ```json
  {
    "name": "glyph",
    "version": "0.1.0",
    "private": true,
    "scripts": {
      "dev": "next dev --hostname 127.0.0.1",
      "lint": "eslint .",
      "typecheck": "next typegen && tsc --noEmit",
      "test": "vitest run",
      "build": "next build"
    }
  }
  ```

  Purpose of each command:

  | Command | Contract |
  | --- | --- |
  | `pnpm dev` | Starts the development application on loopback only. A running server is smoke evidence, not research evidence. |
  | `pnpm lint` | Runs the current Next.js and TypeScript ESLint rules across tracked project code. |
  | `pnpm typecheck` | Generates current Next.js route types, then performs a no-emit strict TypeScript check independently of a production build. |
  | `pnpm test` | Runs the finite Vitest suite once in a Node environment and returns non-zero on failure. |
  | `pnpm build` | Produces an optimized Next.js build and verifies framework integration. |

- [ ] Record the exact locally available pnpm version in the manifest without changing the machine:

  ```bash
  pnpm pkg set packageManager="pnpm@$(pnpm --version)"
  ```

  Expected outcome: the manifest identifies the package manager used to create the lockfile.

### Step 4: Install only the direct Milestone 1 dependencies

- [ ] Install runtime packages directly with pnpm:

  ```bash
  pnpm add next@latest react@latest react-dom@latest
  ```

- [ ] Install the minimal development packages directly with pnpm:

  ```bash
  pnpm add --save-dev typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest eslint@latest eslint-config-next@latest vitest@latest
  ```

  Expected outcome: `package.json` contains exactly three direct runtime dependencies and seven direct development dependencies, and `pnpm-lock.yaml` exists. Do not add Tailwind CSS, Vite as a direct dependency, DOM test libraries, or any package reserved for a later milestone.

### Step 5: Configure strict TypeScript, ESLint, and Vitest

- [ ] Create `tsconfig.json`:

  ```json
  {
    "compilerOptions": {
      "target": "ES2017",
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": false,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "react-jsx",
      "incremental": true,
      "plugins": [{ "name": "next" }],
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": [
      "next-env.d.ts",
      ".next/types/**/*.ts",
      ".next/dev/types/**/*.ts",
      "**/*.ts",
      "**/*.tsx"
    ],
    "exclude": ["node_modules"]
  }
  ```

  Expected outcome: JavaScript source is disallowed, strict checking is enabled, emitted JavaScript is disabled, and application/test files can use `@/*` imports.

- [ ] Create `eslint.config.mjs`:

  ```javascript
  import { defineConfig, globalIgnores } from "eslint/config";
  import nextVitals from "eslint-config-next/core-web-vitals";
  import nextTypeScript from "eslint-config-next/typescript";

  export default defineConfig([
    ...nextVitals,
    ...nextTypeScript,
    globalIgnores([
      ".next/**",
      "out/**",
      "coverage/**",
      "next-env.d.ts",
    ]),
  ]);
  ```

  Expected outcome: linting uses the Next.js core-web-vitals and TypeScript presets through ESLint itself; no historical `next lint` command or extra style rules are introduced.

- [ ] Create `vitest.config.ts`:

  ```typescript
  import { fileURLToPath } from "node:url";
  import { defineConfig } from "vitest/config";

  export default defineConfig({
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      environment: "node",
    },
  });
  ```

  Expected outcome: Vitest can resolve project modules through the same alias as TypeScript and runs without a browser or simulated DOM.

### Step 6: Verify the installed command surface

- [ ] Run:

  ```bash
  pnpm exec next --version
  pnpm exec tsc --version
  pnpm exec eslint --version
  pnpm exec vitest --version
  pnpm list --depth 0
  git diff --check
  ```

  Expected outcome: every executable resolves locally, the direct dependency list matches Step 4 exactly, and no whitespace errors are present. Do not commit yet; Task 2 completes the first executable foundation.

---

## Task 2: Add the minimal local shell through a red-first foundation test

**Files:**

- Create: `tests/foundation/root-page.test.tsx` — proves TypeScript test execution, non-zero failure behavior, project-module imports, TSX transformation, React server rendering, and the prototype label.
- Create: `src/app/page.tsx` — provides the single root-page component.
- Create: `src/app/layout.tsx` — provides the App Router root layout and metadata.
- Create: `src/app/globals.css` — supplies only minimal readable browser defaults.

### Step 1: Write and observe the failing test

- [ ] Create `tests/foundation/root-page.test.tsx` before creating `src/app/page.tsx`:

  ```tsx
  import { renderToStaticMarkup } from "react-dom/server";
  import { expect, test } from "vitest";

  import HomePage from "@/app/page";

  test("identifies the application as the internal research prototype", () => {
    expect(renderToStaticMarkup(<HomePage />)).toContain(
      "<h1>Glyph — Internal Research Prototype</h1>",
    );
  });
  ```

- [ ] Run the focused test and capture its exit status:

  ```bash
  pnpm test tests/foundation/root-page.test.tsx
  echo $?
  ```

  Expected outcome: Vitest discovers the TypeScript/TSX test and returns a non-zero status because `@/app/page` does not exist. If the command returns zero or fails before Vitest can discover the test, correct the harness before adding application files.

### Step 2: Implement the smallest valid App Router shell

- [ ] Create `src/app/page.tsx`:

  ```tsx
  export default function HomePage() {
    return (
      <main>
        <h1>Glyph — Internal Research Prototype</h1>
      </main>
    );
  }
  ```

- [ ] Create `src/app/layout.tsx`:

  ```tsx
  import type { Metadata } from "next";
  import type { ReactNode } from "react";

  import "./globals.css";

  export const metadata: Metadata = {
    title: "Glyph — Internal Research Prototype",
  };

  export default function RootLayout({
    children,
  }: Readonly<{ children: ReactNode }>) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }
  ```

- [ ] Create `src/app/globals.css`:

  ```css
  html,
  body {
    min-height: 100%;
  }

  body {
    margin: 0;
    font-family: system-ui, sans-serif;
  }

  main {
    padding: 2rem;
  }
  ```

  Expected outcome: `/` contains only the internal-prototype heading, with no generic framework content, navigation, product workflow, marketing copy, image asset, or styling framework.

### Step 3: Make the focused test pass and check the shell

- [ ] Run:

  ```bash
  pnpm test tests/foundation/root-page.test.tsx
  pnpm lint
  pnpm typecheck
  pnpm build
  ```

  Expected outcome: the focused test reports one passing test; linting reports no errors; TypeScript generates route types and completes without emitting application JavaScript; and Next.js produces a successful optimized build. Do not commit yet because the command documentation and complete hygiene pass belong in Task 3.

---

## Task 3: Freeze the executable contract, verify the milestone, and commit it

**Files:**

- Modify: `docs/TESTING.md` — records the now-real package commands and the evidence boundary for each.
- Keep unchanged: `AGENTS.md` — its existing verification section already points contributors to `package.json` and `docs/TESTING.md`, so editing it would duplicate information without changing the map.
- Commit with the implementation: `docs/superpowers/plans/2026-08-30-milestone-1-foundation.md` — preserves the approved execution record alongside the foundation.

### Step 1: Document the authoritative commands once

- [ ] Add a `## Milestone 1 command contract` section to `docs/TESTING.md` containing this table and boundary statement:

  ```markdown
  ## Milestone 1 command contract

  `package.json` is the authoritative executable source for these commands.

  | Command | What success proves |
  | --- | --- |
  | `pnpm dev` | The application starts on `127.0.0.1` for local development. A manual root-page response confirms only a local smoke check. |
  | `pnpm lint` | ESLint accepts the current project files under the Next.js core-web-vitals and TypeScript rules. |
  | `pnpm typecheck` | Next.js route types generate and strict TypeScript checking completes with no type errors or emitted JavaScript. |
  | `pnpm test` | The finite Vitest suite passes in its configured Node environment. |
  | `pnpm build` | Next.js can produce an optimized application build from the current source and configuration. |

  These commands verify software behavior and integration. They do not validate carrier survival, model compliance, end-to-end survival, or any research or teacher-facing interpretation.
  ```

  Expected outcome: executable details live in `package.json`, their meaning lives in `docs/TESTING.md`, and `AGENTS.md` remains a concise map.

### Step 2: Prove a fresh reproducible install

- [ ] Validate the exact deletion boundary, remove only generated dependency/build output, and install from the lockfile:

  ```bash
  test "$(pwd -P)" = "/Users/harryjin/Glyph"
  rm -rf -- "/Users/harryjin/Glyph/node_modules" "/Users/harryjin/Glyph/.next"
  pnpm install --frozen-lockfile
  ```

  Expected outcome: installation succeeds without modifying `package.json` or `pnpm-lock.yaml`. If the frozen install changes either file or fails because the lockfile and manifest disagree, repair that mismatch and repeat this step.

### Step 3: Run the complete authoritative verification pass

- [ ] Run every project check in order:

  ```bash
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm build
  ```

  Expected outcome: all four commands exit zero; the test suite reports one meaningful foundation test; and no command is being used as evidence for the research hypothesis.

### Step 4: Perform the local-only development smoke check

- [ ] Start the server in a dedicated terminal:

  ```bash
  pnpm dev --port 3210
  ```

  Expected outcome: Next.js reports a listener on `127.0.0.1:3210`, never `0.0.0.0` or a public host.

- [ ] From a second terminal, verify the root response:

  ```bash
  curl --fail --silent http://127.0.0.1:3210 | rg --fixed-strings 'Glyph — Internal Research Prototype'
  ```

  Expected outcome: `curl` and `rg` both exit zero. Stop the development server with `Ctrl-C`, confirm the process exits, and do not create a tunnel.

### Step 5: Audit dependencies, secrets, generated output, and milestone leakage

- [ ] Confirm the direct dependency surface:

  ```bash
  pnpm list --depth 0
  ```

  Expected outcome: the only runtime dependencies are Next.js, React, and React DOM; the only development dependencies are TypeScript, the three required type packages, ESLint, the Next.js ESLint configuration, and Vitest.

- [ ] Scan the executable/configuration surface for credential-shaped content:

  ```bash
  rg -n --hidden '(BEGIN [A-Z ]*PRIVATE KEY|DATABASE_URL=|SUPABASE_[A-Z_]+=|API_KEY=|SECRET_KEY=)' package.json src tests .gitignore tsconfig.json eslint.config.mjs vitest.config.ts
  ```

  Expected outcome: no matches.

- [ ] Confirm generated output is ignored rather than tracked:

  ```bash
  git status --short --ignored
  git ls-files | rg '(^|/)(node_modules|\.next|coverage|\.vitest)/|next-env\.d\.ts$|\.tsbuildinfo$'
  ```

  Expected outcome: dependency/build output appears only as ignored where present, and the `git ls-files` query returns no matches.

- [ ] Confirm Milestone 2+ concepts did not leak into executable files:

  ```bash
  rg -n -i 'w:vanish|GLYPH TEST MARKER|FingerprintEngine|ExactCanary|Supabase|Protect Assignment|Analyze Submission' src tests package.json
  ```

  Expected outcome: no matches.

- [ ] Review the complete change:

  ```bash
  git diff --check
  git status --short
  git diff -- . ':(exclude)pnpm-lock.yaml'
  git diff --stat
  ```

  Expected outcome: every changed path is listed in this plan, no Milestone 0 specification file other than `docs/TESTING.md` changed, and no unrelated file is present.

### Step 6: Create one coherent Milestone 1 commit

- [ ] Stage only the reviewed Milestone 1 paths:

  ```bash
  git add .gitignore package.json pnpm-lock.yaml tsconfig.json eslint.config.mjs vitest.config.ts src/app tests/foundation docs/TESTING.md docs/superpowers/plans/2026-08-30-milestone-1-foundation.md
  git diff --cached --check
  git diff --cached --stat
  ```

- [ ] Commit without changing Git identity or rewriting history:

  ```bash
  git commit -m "chore: establish Glyph research foundation"
  ```

  If Git cannot create the commit with the repository's existing identity, stop and report the error. Do not change local or global identity settings.

- [ ] Verify the final repository state:

  ```bash
  git status --short --branch
  git log -1 --oneline --decorate
  ```

  Expected outcome: the branch is clean, the new commit is on top of the untouched Milestone 0 commit, and Milestone 2 has not begun.

---

## Milestone 1 Completion Boundary

Milestone 1 is complete only when the frozen install, lint, independent type check, Node-side test, production build, loopback smoke check, dependency audit, secret scan, generated-output audit, milestone-leakage scan, diff review, and clean Git status all satisfy their stated outcomes. Stop at that point and request explicit approval before any DOCX carrier work or other Milestone 2 activity.
