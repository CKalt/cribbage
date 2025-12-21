# Lockdown NPM - PGIS Compliance Plan

## Table of Contents

- [x] [Overview](#overview)
- [x] [Problem Statement](#problem-statement)
- [x] [Audit Results](#audit-results)
  - [x] [1.1 Violation 1: Missing .npmrc Configuration](#11-violation-1-missing-npmrc-configuration)
  - [x] [1.2 Violation 2: Loose Version Ranges in package.json](#12-violation-2-loose-version-ranges-in-packagejson)
- [x] [Phase 1: Create .npmrc Configuration 🤖](#phase-1-create-npmrc-configuration-🤖)
  - [x] [1.1 Create .npmrc file](#11-create-npmrc-file-🤖)
- [x] [Phase 2: Pin All Dependencies to Exact Versions 🤖](#phase-2-pin-all-dependencies-to-exact-versions-🤖)
  - [x] [2.1 Remove caret prefixes from dependencies](#21-remove-caret-prefixes-from-dependencies-🤖)
  - [x] [2.2 Remove caret prefixes from devDependencies](#22-remove-caret-prefixes-from-devdependencies-🤖)
  - [x] [2.3 Update eslint-config-next to match Next.js 16](#23-update-eslint-config-next-to-match-nextjs-16-🤖)
- [x] [Phase 3: Regenerate package-lock.json 🤖](#phase-3-regenerate-package-lockjson-🤖)
  - [x] [3.1 Delete package-lock.json](#31-delete-package-lockjson-🤖)
  - [x] [3.2 Delete node_modules](#32-delete-node_modules-🤖)
  - [x] [3.3 Run npm install](#33-run-npm-install-🤖)
  - [x] [3.4 Run npm audit](#34-run-npm-audit-🤖)
  - [x] [3.5 Git commit changes](#35-git-commit-changes-🤖)
- [x] [Phase 4: Deploy to pg2 👤](#phase-4-deploy-to-pg2-👤)
  - [x] [4.1 User pushes from Mac](#41-user-pushes-from-mac-👤)
  - [x] [4.2 User pulls on pg2](#42-user-pulls-on-pg2-👤)
  - [x] [4.3 Clean install with npm ci](#43-clean-install-with-npm-ci-🤖)
  - [x] [4.4 Build application](#44-build-application-🤖)
  - [x] [4.5 Restart PM2](#45-restart-pm2-🤖)
  - [x] [4.6 Verify no malware](#46-verify-no-malware-🤖)

---

## Overview

This plan addresses violations of the Package Management & Security Standards defined in `prompts/lockdown-npm-better.md`. The goal is to prevent dependency drift by pinning all packages to exact versions.

[Back to TOC](#table-of-contents)

---

## Problem Statement

The current PGIS `package.json` uses loose semantic versioning ranges (caret `^` prefixes) for all dependencies. This allows unexpected updates during `npm install` which can:

1. Introduce breaking changes
2. Pull in compromised package versions (as experienced in the Dec 2025 malware incident)
3. Cause inconsistent builds between environments

[Back to TOC](#table-of-contents)

---

## Audit Results

### 1.1 Violation 1: Missing .npmrc Configuration

**Standard:** Project root must have `.npmrc` with `save-exact=true`

**Finding:** No `.npmrc` file exists in `/Users/chris/projects/pgis/interactive-query-app/`

**Risk:** Future `npm install <package>` commands will add packages with `^` prefix by default.

**Status:** ✅ FIXED - `.npmrc` created on 2025-12-09

[Back to TOC](#table-of-contents)

### 1.2 Violation 2: Loose Version Ranges in package.json

**Standard:** All dependencies must use exact versions (e.g., `"1.2.3"` not `"^1.2.3"`)

**Finding:** 25 out of 26 dependencies use caret (`^`) or loose ranges:

#### Dependencies (20 violations):
| Package | Current | Should Be |
|---------|---------|-----------|
| @aws-sdk/client-cognito-identity-provider | ^3.708.0 | 3.708.0 |
| @preset-sdk/embedded | ^0.1.8 | 0.1.8 |
| @radix-ui/react-collapsible | ^1.1.12 | 1.1.12 |
| @radix-ui/react-dialog | ^1.1.15 | 1.1.15 |
| @tailwindcss/forms | ^0.5.9 | 0.5.9 |
| amazon-cognito-identity-js | ^6.3.12 | 6.3.12 |
| aws-jwt-verify | ^5.1.1 | 5.1.1 |
| axios | ^1.6.7 | 1.6.7 |
| class-variance-authority | ^0.7.1 | 0.7.1 |
| clsx | ^2.1.1 | 2.1.1 |
| date-fns | ^4.1.0 | 4.1.0 |
| lucide-react | ^0.263.1 | 0.263.1 |
| next | ^16.0.8 | 16.0.8 |
| nookies | ^2.5.2 | 2.5.2 |
| pg | ^8.13.1 | 8.13.1 |
| react | ^18.2.0 | 18.2.0 |
| react-datepicker | ^7.5.0 | 7.5.0 |
| react-dom | ^18.2.0 | 18.2.0 |
| react-icons | ^5.3.0 | 5.3.0 |
| tailwind-merge | ^3.3.1 | 3.3.1 |

#### DevDependencies (9 violations):
| Package | Current | Should Be |
|---------|---------|-----------|
| @testing-library/jest-dom | ^6.9.1 | 6.9.1 |
| @testing-library/react | ^16.3.0 | 16.3.0 |
| autoprefixer | ^10.4.20 | 10.4.20 |
| dotenv-cli | ^7.4.4 | 7.4.4 |
| eslint | ^8 | 8.57.1 |
| jest | ^30.2.0 | 30.2.0 |
| jest-environment-jsdom | ^30.2.0 | 30.2.0 |
| postcss | ^8.4.49 | 8.4.49 |
| tailwindcss | ^3.4.14 | 3.4.14 |

**Note:** `eslint-config-next` is already pinned to `15.0.3` but should be updated to `16.0.8` to match Next.js version.

**Status:** ✅ FIXED - All versions pinned on 2025-12-09

[Back to TOC](#table-of-contents)

---

## Phase 1: Create .npmrc Configuration 🤖

### 1.1 Create .npmrc file 🤖

- [x] Create `.npmrc` file in project root with:
  ```ini
  save-exact=true
  audit=true
  ```

**Completed:** 2025-12-09 14:06 - File created successfully

[Back to TOC](#table-of-contents)

---

## Phase 2: Pin All Dependencies to Exact Versions 🤖

### 2.1 Remove caret prefixes from dependencies 🤖

- [x] Update all dependencies in `package.json` to remove `^` prefix:
  - [x] `@aws-sdk/client-cognito-identity-provider`: `^3.708.0` → `3.708.0`
  - [x] `@preset-sdk/embedded`: `^0.1.8` → `0.3.0` (upgraded to fix empty @superset-ui/switchboard dependency)
  - [x] `@radix-ui/react-collapsible`: `^1.1.12` → `1.1.12`
  - [x] `@radix-ui/react-dialog`: `^1.1.15` → `1.1.15`
  - [x] `@tailwindcss/forms`: `^0.5.9` → `0.5.9`
  - [x] `amazon-cognito-identity-js`: `^6.3.12` → `6.3.12`
  - [x] `aws-jwt-verify`: `^5.1.1` → `5.1.1`
  - [x] `axios`: `^1.6.7` → `1.13.2` (upgraded to fix SSRF/DoS vulnerabilities)
  - [x] `class-variance-authority`: `^0.7.1` → `0.7.1`
  - [x] `clsx`: `^2.1.1` → `2.1.1`
  - [x] `date-fns`: `^4.1.0` → `4.1.0`
  - [x] `lucide-react`: `^0.263.1` → `0.263.1`
  - [x] `next`: `^16.0.8` → `16.0.8`
  - [x] `nookies`: `^2.5.2` → `2.5.2`
  - [x] `pg`: `^8.13.1` → `8.13.1`
  - [x] `react`: `^18.2.0` → `18.2.0`
  - [x] `react-datepicker`: `^7.5.0` → `7.5.0`
  - [x] `react-dom`: `^18.2.0` → `18.2.0`
  - [x] `react-icons`: `^5.3.0` → `5.3.0`
  - [x] `tailwind-merge`: `^3.3.1` → `3.3.1`

**Completed:** 2025-12-09 14:06

[Back to TOC](#table-of-contents)

### 2.2 Remove caret prefixes from devDependencies 🤖

- [x] Update all devDependencies in `package.json` to remove `^` prefix:
  - [x] `@testing-library/jest-dom`: `^6.9.1` → `6.9.1`
  - [x] `@testing-library/react`: `^16.3.0` → `16.3.0`
  - [x] `autoprefixer`: `^10.4.20` → `10.4.20`
  - [x] `dotenv-cli`: `^7.4.4` → `7.4.4`
  - [x] `eslint`: `^8` → `9.39.1` (upgraded for eslint-config-next@16 compatibility)
  - [x] `jest`: `^30.2.0` → `30.2.0`
  - [x] `jest-environment-jsdom`: `^30.2.0` → `30.2.0`
  - [x] `postcss`: `^8.4.49` → `8.4.49`
  - [x] `tailwindcss`: `^3.4.14` → `3.4.14`

**Completed:** 2025-12-09 14:06

[Back to TOC](#table-of-contents)

### 2.3 Update eslint-config-next to match Next.js 16 🤖

- [x] Update `eslint-config-next`: `15.0.3` → `16.0.8`

**Completed:** 2025-12-09 14:06

[Back to TOC](#table-of-contents)

---

## Phase 3: Regenerate package-lock.json 🤖

### 3.1 Delete package-lock.json 🤖

- [x] Run: `rm package-lock.json`

**Completed:** 2025-12-09 14:11

[Back to TOC](#table-of-contents)

### 3.2 Delete node_modules 🤖

- [x] Run: `rm -rf node_modules`

**Completed:** 2025-12-09 14:11

[Back to TOC](#table-of-contents)

### 3.3 Run npm install 🤖

- [x] Run: `npm install`
- [x] Verify new `package-lock.json` is generated

**Completed:** 2025-12-09 14:13 - 904 packages installed

[Back to TOC](#table-of-contents)

### 3.4 Run npm audit 🤖

- [x] Run: `npm audit`
- [x] Verify no critical or high vulnerabilities
- [x] Run `npm audit fix` if needed

**Result:** 2 low severity vulnerabilities remaining (cookie/nookies - no upstream fix available)

**Completed:** 2025-12-09 14:13

[Back to TOC](#table-of-contents)

### 3.5 Git commit changes 🤖

- [x] Run: `git add .npmrc package.json package-lock.json`
- [x] Run: `git commit -m "chore: pin all dependencies to exact versions for security"`

**Completed:** 2025-12-09 14:17 - Commit b9dbcc5

Additional changes included:
- Updated next.config.mjs with turbopack.root for workspace compatibility
- Added lockdown-npm protocol documents

[Back to TOC](#table-of-contents)

---

## Phase 4: Deploy to pg2 👤

### 4.1 User pushes from Mac 👤

- [x] User runs: `git push`

**Completed:** 2025-12-09 15:14

[Back to TOC](#table-of-contents)

### 4.2 User pulls on pg2 👤

- [x] User runs on pg2:
  ```bash
  gg pgis
  git pull
  ```

**Completed:** 2025-12-09 15:14 - Fast-forward from e9b591e to 5d57e71

[Back to TOC](#table-of-contents)

### 4.3 Clean install with npm ci 🤖

- [x] Run: `rm -rf node_modules`
- [x] Run: `npm ci --ignore-scripts` (per CI/CD standard - uses exact lockfile versions, disables postinstall scripts to prevent malware execution)

**Security Note:** The `--ignore-scripts` flag prevents execution of any `postinstall`, `preinstall`, or other lifecycle scripts in dependencies. This blocks the primary attack vector used in the Dec 2025 supply chain attack. If the build fails due to a legitimate package needing a build step, investigate that specific package before allowing scripts.

**Completed:** 2025-12-09 15:14 - 904 packages installed, 2 low severity vulnerabilities (cookie/nookies - no upstream fix)

[Back to TOC](#table-of-contents)

### 4.4 Build application 🤖

- [x] Run: `npm run build`
- [x] Verify build completes successfully

**Completed:** 2025-12-09 15:14 - Next.js 16.0.8 (Turbopack) build successful

[Back to TOC](#table-of-contents)

### 4.5 Restart PM2 🤖

- [x] Run: `pm2 restart pgis`
- [x] Run: `pm2 save`

**Completed:** 2025-12-09 15:14 - pgis online (PID 94468)

[Back to TOC](#table-of-contents)

### 4.6 Verify no malware 🤖

- [x] Run malware checks:
  ```bash
  ps aux --sort=-%cpu | head -15
  pgrep -af 'xmrig|c3pool|monero|runnv'
  grep -r "cdnapi.tech|li1.pics|45.134.174" node_modules/ 2>/dev/null | head -5
  ```
- [x] Verify system is clean

**Completed:** 2025-12-09 15:15 - All checks passed:
- No malware processes found
- No malware domains in node_modules (0 matches)
- CPU usage normal (next-server at 4.9%)

[Back to TOC](#table-of-contents)

---

*Document created: December 9, 2025*
*Related to: Package Management & Security Standards*
*Reference: prompts/lockdown-npm-better.md*
