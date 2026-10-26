# MADHAQ Startup & Local Authentication Design

**Goal:** Replace the confusing email-first entry with a clear offline-first startup flow: branded splash → welcome → first-run manager setup or username/password login → factory system.

## Decisions

- Authentication is local/offline because the current MADHAQ data architecture is browser/app local storage and has no connected account server.
- The first run must not require a pre-existing email or password. If no manager account exists, the user creates the first Manager account on-device.
- Login uses username + password, not email.
- The initial manager username is `admin` only when the first-run setup explicitly chooses it; the user sets the manager display name and password during setup.
- A local password verifier is stored as a one-way digest rather than plain text.
- Session state is local and can be ended with logout.
- Existing business data remains untouched by authentication changes.
- Startup UX is three stages: branded splash, welcome, then access screen. The existing factory UI is shown only after successful authentication.

## First-run Manager

The first launch presents:
- Role: مدير النظام
- Display name: required
- Username: required, suggested `admin`
- Password: required, minimum 6 characters
- Confirm password: required

After creation, the app shows the exact username the manager chose and asks them to sign in. No email is required.

## Existing Install Safety

If the application already contains business data but has no local account, first-run manager setup is still required. It does not clear or reseed business data.

## Branding

Use the existing `/madhaq_logo.png` asset without distortion. Splash and welcome screens must work on phone and desktop, RTL Arabic first, with restrained motion and accessible contrast.

## Acceptance Criteria

1. No screen asks for an unknown email.
2. Fresh install: splash → welcome → manager setup → login → dashboard.
3. Subsequent launch: splash → welcome → login → dashboard.
4. Wrong credentials do not enter the system.
5. Logout returns to login without deleting business data.
6. Manager credentials survive application restart.
7. Business records remain unchanged by auth initialization.
8. TypeScript/build validation passes.
