# Auth & Deployment Testing Plan

**Created**: 2026-02-19
**Author**: Claude Code
**Status**: Draft
**Triggered by**: Bug BR-20260219 — auth timeout code caused redirect flash loop on production

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Problem Statement](#2-problem-statement)
- [3. Phase 1: Auth Flow Test Suite](#3-phase-1-auth-flow-test-suite) 🤖
  - [3.1 Valid session test](#31-valid-session-test) 🤖
  - [3.2 Expired session test](#32-expired-session-test) 🤖
  - [3.3 Missing cookie with valid Cognito session test](#33-missing-cookie-with-valid-cognito-session-test) 🤖
  - [3.4 Missing Cognito session with valid cookie test](#34-missing-cognito-session-with-valid-cookie-test) 🤖
  - [3.5 No redirect loop test](#35-no-redirect-loop-test) 🤖
- [4. Phase 2: Pre-Deploy Smoke Test Script](#4-phase-2-pre-deploy-smoke-test-script) 🤖
  - [4.1 Build verification](#41-build-verification) 🤖
  - [4.2 Auth flow smoke test](#42-auth-flow-smoke-test) 🤖
  - [4.3 Critical path smoke test](#43-critical-path-smoke-test) 🤖
- [5. Phase 3: Post-Deploy Health Check](#5-phase-3-post-deploy-health-check) 🤖
  - [5.1 Server health endpoint](#51-server-health-endpoint) 🤖
  - [5.2 Automated post-deploy check](#52-automated-post-deploy-check) 🤖
- [6. Phase 4: Deployment Safety Rules](#6-phase-4-deployment-safety-rules) 🤖👤
  - [6.1 Never-touch rules](#61-never-touch-rules) 🤖
  - [6.2 Batch deploys](#62-batch-deploys) 🤖
  - [6.3 Rollback procedure](#63-rollback-procedure) 🤖

---

## 1. Overview

This plan establishes testing practices to prevent authentication and deployment issues from reaching production. The immediate trigger was a cascade of rapid deploys that introduced auth timeouts, which deleted user cookies and caused a redirect flash loop — a severe user-facing bug.

[Back to TOC](#table-of-contents)

---

## 2. Problem Statement

On 2026-02-19, while deploying Expert Mode features, a user reported being stuck on "Validating authentication." The attempted fix — adding timeouts to `AuthContext.jsx` and `withAuth.jsx` — deleted the auth cookie without clearing the Cognito localStorage session. This created an infinite redirect loop between `/` and `/login` that affected all users.

**Root causes:**
1. No automated tests for the auth flow (login, session validation, cookie/Cognito sync)
2. No pre-deploy smoke tests that verify auth works end-to-end
3. No post-deploy health check to catch issues before users do
4. Too many rapid deploys without verifying each one on a real device
5. Auth code was modified without understanding the cookie-Cognito dual dependency

**Key lesson:** The auth flow has two independent session stores (cookie and Cognito localStorage). Any change that clears one without the other creates a redirect loop. The auth code must be treated as critical infrastructure — never modified without tests.

[Back to TOC](#table-of-contents)

---

## 3. Phase 1: Auth Flow Test Suite 🤖

Create Playwright tests in `test-bin/auth-flow.spec.js` that verify all auth states.

### 3.1 Valid session test 🤖
- [ ] Test that a logged-in user with valid cookie + valid Cognito session loads the game without redirects
- [ ] Verify no "Validating authentication" screen lingers more than 3 seconds

[Back to TOC](#table-of-contents)

### 3.2 Expired session test 🤖
- [ ] Test that an expired Cognito session redirects cleanly to `/login`
- [ ] Verify the cookie is cleared on redirect
- [ ] Verify no redirect loop (page stays on `/login`)

[Back to TOC](#table-of-contents)

### 3.3 Missing cookie with valid Cognito session test 🤖
- [ ] Delete the `token` cookie while Cognito session is valid
- [ ] Verify the app recovers — either restores the cookie or redirects to login once (no loop)
- [ ] This is the exact scenario that caused the bug

[Back to TOC](#table-of-contents)

### 3.4 Missing Cognito session with valid cookie test 🤖
- [ ] Clear Cognito localStorage while cookie exists
- [ ] Verify clean redirect to `/login` without loop

[Back to TOC](#table-of-contents)

### 3.5 No redirect loop test 🤖
- [ ] Navigate to `/` and count redirects over 5 seconds
- [ ] Fail the test if more than 1 redirect occurs (the smoking gun for loops)
- [ ] This is the most critical test — it catches any future cookie/session mismatch

[Back to TOC](#table-of-contents)

---

## 4. Phase 2: Pre-Deploy Smoke Test Script 🤖

Create `scripts/pre-deploy-check.sh` that runs before every production deploy.

### 4.1 Build verification 🤖
- [ ] Run `npm run build` and verify exit code 0
- [ ] Check for TypeScript/lint errors

[Back to TOC](#table-of-contents)

### 4.2 Auth flow smoke test 🤖
- [ ] Run the auth Playwright tests from Phase 1
- [ ] Block deploy if any auth test fails

[Back to TOC](#table-of-contents)

### 4.3 Critical path smoke test 🤖
- [ ] Run existing Playwright tests (expert-mode, basic gameplay)
- [ ] Block deploy if any fail

[Back to TOC](#table-of-contents)

---

## 5. Phase 3: Post-Deploy Health Check 🤖

### 5.1 Server health endpoint 🤖
- [ ] Create `/api/health` endpoint that returns `{ ok: true, version: APP_VERSION }`
- [ ] Does not require auth — can be checked externally

[Back to TOC](#table-of-contents)

### 5.2 Automated post-deploy check 🤖
- [ ] After `pm2 restart`, curl `/api/health` and verify correct version
- [ ] Optionally run a headless Playwright login test against production
- [ ] Add to the deploy command sequence

[Back to TOC](#table-of-contents)

---

## 6. Phase 4: Deployment Safety Rules 🤖👤

### 6.1 Never-touch rules 🤖
- [ ] Add to CLAUDE.md: **NEVER modify `withAuth.jsx` or `AuthContext.jsx` without running the full auth test suite**
- [ ] Add to CLAUDE.md: **NEVER delete cookies or localStorage in auth code without clearing BOTH stores**
- [ ] Add to CLAUDE.md: **NEVER add timeouts that redirect users — use retry logic or user-facing "Try Again" buttons instead**

[Back to TOC](#table-of-contents)

### 6.2 Batch deploys 🤖
- [ ] Add to CLAUDE.md: **Batch feature changes into a single deploy rather than deploying 5+ times in rapid succession**
- [ ] Each deploy risks cache mismatches on connected clients — minimize deploy frequency

[Back to TOC](#table-of-contents)

### 6.3 Rollback procedure 🤖
- [ ] Document a one-command rollback: `git revert HEAD && git push && ssh ... build && restart`
- [ ] When a production bug is reported, FIRST rollback to the last known good state, THEN investigate
- [ ] Never attempt to fix forward with untested code when users are actively affected

[Back to TOC](#table-of-contents)
