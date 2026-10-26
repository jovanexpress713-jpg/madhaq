# MADHAQ Startup & Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real offline-first MADHAQ entry experience with branded splash, welcome screen, first-run Manager setup, username/password login, and logout.

**Architecture:** Add a small local authentication service isolated from the existing business storage. Add an entry-flow component that owns splash/welcome/setup/login state and renders the existing factory app only after authentication. Do not change the existing business database schema or records.

**Tech Stack:** React 19, TypeScript, Vite 8, existing Tailwind CSS, lucide-react, browser localStorage.

**Spec:** `docs/superpowers/specs/2026-10-26-madhaq-auth-flow.md`

## Global Constraints

- Authentication remains offline/local; no email or external auth provider is required.
- Existing MADHAQ business data must remain intact.
- Use the existing `/madhaq_logo.png` branding asset without distortion.
- RTL Arabic is primary and the flow must remain usable on mobile and desktop.
- Never claim validation is complete until the repository validation commands actually pass.

## Review Focus

- Fresh install with no account → manager setup rather than an impossible email login.
- Existing business data with no account → setup must not clear business data.
- Wrong username/password → remain locked out with a clear Arabic error.
- Restart after account creation → account remains available locally.
- Logout → returns to login without deleting operational records.

### Task 1: Local authentication service

**Files:**
- Create: `src/services/auth.ts`
- Create: `scripts/auth-flow-smoke.ts`
- Modify: `package.json`

**Interfaces:**
- `getAuthState(): AuthState`
- `createManager(input): AuthResult`
- `login(username, password): AuthResult`
- `logout(): void`
- `getCurrentUser(): LocalUser | null`

- [ ] Write smoke checks for first-run state, manager creation, successful login, failed login, persistence, and logout.
- [ ] Implement a local one-way password digest using Web Crypto with a stored salt; do not store plaintext passwords.
- [ ] Persist only auth metadata/session in a dedicated key separate from `madhaq_factory_db_v1`.
- [ ] Add the smoke command to `package.json`.
- [ ] Run the smoke check and TypeScript validation.

### Task 2: Branded entry flow

**Files:**
- Create: `src/components/MadhaqEntryFlow.tsx`
- Modify: `src/index.css`
- Modify: `src/main.tsx` if needed

**Interfaces:**
- Renders `splash`, `welcome`, `setup`, and `login` states.
- On successful login, renders the existing `App`.
- Exposes logout callback to the factory shell through a small session boundary.

- [ ] Implement splash using `/madhaq_logo.png` and a short accessible animation.
- [ ] Implement welcome screen with `ابدأ الآن`.
- [ ] Implement first-run Manager setup with display name, username, password, confirmation.
- [ ] Implement username/password login with no email field.
- [ ] Show the manager username after setup so it is never forgotten.
- [ ] Keep all screens RTL and responsive.
- [ ] Verify no auth stage deletes business data.

### Task 3: Integrate with the existing factory shell

**Files:**
- Modify: `src/main.tsx` and/or `src/App.tsx`
- Create if needed: `src/components/AuthenticatedApp.tsx`

- [ ] Ensure the factory UI is inaccessible before login.
- [ ] Remove duplicate/incorrect post-login splash behavior if necessary.
- [ ] Add a visible logout action in the authenticated shell without changing existing workflows.
- [ ] Preserve current storage subscription and dashboard behavior.

### Task 4: Validation and delivery

- [ ] Run `bun run auth:smoke`.
- [ ] Run `bun run lint`.
- [ ] Run `bun run build`.
- [ ] Run the existing production and workflow smoke checks.
- [ ] Inspect the resulting commit(s) and verify the startup path and credentials are represented accurately in the README.
- [ ] Update README with the first-run Manager instructions and clarify that the app does not require an email for local mode.
