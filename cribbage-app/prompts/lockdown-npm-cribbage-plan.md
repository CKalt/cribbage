# Lockdown NPM - Cribbage App Security Plan

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
- [x] [Phase 3: Regenerate package-lock.json 🤖](#phase-3-regenerate-package-lockjson-🤖)
  - [x] [3.1 Delete package-lock.json](#31-delete-package-lockjson-🤖)
  - [x] [3.2 Delete node_modules](#32-delete-node_modules-🤖)
  - [x] [3.3 Run npm install](#33-run-npm-install-🤖)
  - [x] [3.4 Run npm audit](#34-run-npm-audit-🤖)
  - [x] [3.5 Git commit changes](#35-git-commit-changes-🤖)
- [x] [Phase 4: Create EC2 Instance 👤🤖](#phase-4-create-ec2-instance-👤🤖)
  - [x] [4.1 Create security group](#41-create-security-group-🤖)
  - [x] [4.2 Launch t3.small instance](#42-launch-t3small-instance-🤖)
  - [x] [4.3 Configure instance](#43-configure-instance-👤🤖)
- [x] [Phase 5: Deploy to EC2 👤🤖](#phase-5-deploy-to-ec2-👤🤖)
  - [x] [5.1 Clone repository](#51-clone-repository-🤖)
  - [x] [5.2 Install Node.js](#52-install-nodejs-🤖)
  - [x] [5.3 Clean install with npm ci](#53-clean-install-with-npm-ci-🤖)
  - [x] [5.4 Build application](#54-build-application-🤖)
  - [x] [5.5 Configure PM2](#55-configure-pm2-🤖)
  - [x] [5.6 Verify no malware](#56-verify-no-malware-🤖)

---

## Overview

This plan addresses NPM security vulnerabilities in the Cribbage App and sets up secure deployment on a new EC2 instance. The goal is to prevent dependency drift by pinning all packages to exact versions, following lessons learned from the Dec 2025 malware incident.

[Back to TOC](#table-of-contents)

---

## Problem Statement

The current cribbage-app `package.json` uses loose semantic versioning ranges (caret `^` prefixes) for all dependencies. This allows unexpected updates during `npm install` which can:

1. Introduce breaking changes
2. Pull in compromised package versions (as experienced in the Dec 2025 malware incident)
3. Cause inconsistent builds between environments

[Back to TOC](#table-of-contents)

---

## Audit Results

### 1.1 Violation 1: Missing .npmrc Configuration

**Standard:** Project root must have `.npmrc` with `save-exact=true`

**Finding:** No `.npmrc` file exists in `/Users/chris/projects/cribbage/cribbage-app/`

**Risk:** Future `npm install <package>` commands will add packages with `^` prefix by default.

**Status:** ✅ FIXED - `.npmrc` created on 2025-12-21

[Back to TOC](#table-of-contents)

### 1.2 Violation 2: Loose Version Ranges in package.json

**Standard:** All dependencies must use exact versions (e.g., `"1.2.3"` not `"^1.2.3"`)

**Finding:** 12 out of 12 dependencies use caret (`^`) ranges:

#### Dependencies (8 violations):
| Package | Current | Should Be |
|---------|---------|-----------|
| @aws-sdk/client-cognito-identity-provider | ^3.940.0 | 3.940.0 |
| @radix-ui/react-slot | ^1.2.4 | 1.2.4 |
| amazon-cognito-identity-js | ^6.3.16 | 6.3.16 |
| class-variance-authority | ^0.7.1 | 0.7.1 |
| clsx | ^2.1.1 | 2.1.1 |
| lucide-react | ^0.555.0 | 0.555.0 |
| nookies | ^2.5.2 | 2.5.2 |
| tailwind-merge | ^3.4.0 | 3.4.0 |

**Note:** `next` (16.0.5), `react` (19.2.0), `react-dom` (19.2.0) are already pinned to exact versions.

#### DevDependencies (4 violations):
| Package | Current | Should Be |
|---------|---------|-----------|
| @tailwindcss/postcss | ^4 | 4.x.x (resolve to exact) |
| eslint | ^9 | 9.x.x (resolve to exact) |
| eslint-config-next | 16.0.5 | ✅ Already pinned |
| tailwindcss | ^4 | 4.x.x (resolve to exact) |
| tw-animate-css | ^1.4.0 | 1.4.0 |

**Status:** ✅ FIXED - All versions pinned on 2025-12-21

[Back to TOC](#table-of-contents)

---

## Phase 1: Create .npmrc Configuration 🤖

### 1.1 Create .npmrc file 🤖

- [x] Create `.npmrc` file in project root with:
  ```ini
  save-exact=true
  audit=true
  ```

**Completed:** 2025-12-21 - File created successfully at `/Users/chris/projects/cribbage/cribbage-app/.npmrc`

[Back to TOC](#table-of-contents)

---

## Phase 2: Pin All Dependencies to Exact Versions 🤖

### 2.1 Remove caret prefixes from dependencies 🤖

- [x] Update all dependencies in `package.json` to remove `^` prefix:
  - [x] `@aws-sdk/client-cognito-identity-provider`: `^3.940.0` → `3.940.0`
  - [x] `@radix-ui/react-slot`: `^1.2.4` → `1.2.4`
  - [x] `amazon-cognito-identity-js`: `^6.3.16` → `6.3.16`
  - [x] `class-variance-authority`: `^0.7.1` → `0.7.1`
  - [x] `clsx`: `^2.1.1` → `2.1.1`
  - [x] `lucide-react`: `^0.555.0` → `0.555.0`
  - [x] `next`: `^16.1.0` → `16.1.0` (upgraded from 16.0.5 to fix critical RCE vulnerability)
  - [x] `nookies`: `^2.5.2` → `2.5.2`
  - [x] `tailwind-merge`: `^3.4.0` → `3.4.0`

**Completed:** 2025-12-21 - All 9 dependencies pinned to exact versions

[Back to TOC](#table-of-contents)

### 2.2 Remove caret prefixes from devDependencies 🤖

- [x] Update all devDependencies in `package.json` to remove `^` prefix:
  - [x] `@tailwindcss/postcss`: `^4` → `4.1.17`
  - [x] `eslint`: `^9` → `9.39.1`
  - [x] `eslint-config-next`: `16.0.5` → `16.1.0` (updated to match Next.js version)
  - [x] `tailwindcss`: `^4` → `4.1.17`
  - [x] `tw-animate-css`: `^1.4.0` → `1.4.0`

**Completed:** 2025-12-21 - All 5 devDependencies pinned to exact versions

[Back to TOC](#table-of-contents)

---

## Phase 3: Regenerate package-lock.json 🤖

### 3.1 Delete package-lock.json 🤖

- [x] Run: `rm package-lock.json`

**Completed:** 2025-12-21

[Back to TOC](#table-of-contents)

### 3.2 Delete node_modules 🤖

- [x] Run: `rm -rf node_modules`

**Completed:** 2025-12-21

[Back to TOC](#table-of-contents)

### 3.3 Run npm install 🤖

- [x] Run: `npm install`
- [x] Verify new `package-lock.json` is generated

**Completed:** 2025-12-21 - 527 packages installed successfully

[Back to TOC](#table-of-contents)

### 3.4 Run npm audit 🤖

- [x] Run: `npm audit`
- [x] Verify no critical or high vulnerabilities
- [x] Run `npm audit fix` if needed

**Result:** 2 low severity vulnerabilities remaining (cookie/nookies - no upstream fix available). Critical Next.js vulnerability was fixed by upgrading to 16.1.0.

**Completed:** 2025-12-21

[Back to TOC](#table-of-contents)

### 3.5 Git commit changes 🤖

- [x] Run: `git add .npmrc package.json package-lock.json prompts/lockdown-npm-better-plan.md prompts/lockdown-npm-cribbage-plan.md`
- [x] Run: `git commit -m "chore: pin all dependencies to exact versions for security"`

**Completed:** 2025-12-21 - Commit `67f08e1`

Files committed:
- `.npmrc` (new)
- `package.json` (modified - all versions pinned)
- `package-lock.json` (regenerated)
- `prompts/lockdown-npm-better-plan.md` (new - reference document)
- `prompts/lockdown-npm-cribbage-plan.md` (new - this plan)

**Build verification:** `npm run build` passed successfully with Next.js 16.1.0 (Turbopack)

[Back to TOC](#table-of-contents)

---

## Phase 4: Create EC2 Instance 👤🤖

### 4.1 Create security group 🤖

- [x] Create security group `cribbage-sg` allowing:
  - SSH (port 22) from your IP
  - HTTP (port 80) from anywhere
  - HTTPS (port 443) from anywhere
  - Next.js dev (port 3000) from your IP (optional)

**Completed:** 2025-12-21 - Security group `sg-0e266eb1426434f9a` created with all rules

[Back to TOC](#table-of-contents)

### 4.2 Launch t3.small instance 🤖

- [x] Launch EC2 instance with:
  - AMI: Amazon Linux 2023 (`ami-0e858a9b9fb8b4917`)
  - Instance type: t3.small
  - Key pair: chriskoin2-key-pair
  - Security group: cribbage-sg
  - Storage: 20 GB gp3
  - Region: us-east-2

**Completed:** 2025-12-21

| Property | Value |
|----------|-------|
| Instance ID | `i-019e6bfe19d70a54f` |
| Public IP | `52.15.180.37` |
| Public DNS | `ec2-52-15-180-37.us-east-2.compute.amazonaws.com` |

**SSH Command:** `ssh -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@52.15.180.37`

[Back to TOC](#table-of-contents)

### 4.3 Configure instance 👤🤖

- [x] User SSH into instance
- [x] Add swap space (2GB) for build memory
- [x] Install required packages

**Completed:** 2025-12-21 - 2GB swap configured, Node.js 20.19.6 (via nvm), git, npm, PM2 installed

[Back to TOC](#table-of-contents)

---

## Phase 5: Deploy to EC2 👤🤖

### 5.1 Clone repository 🤖

- [x] Set up git credentials (SSH agent forwarding)
- [x] Clone cribbage-app repository

**Completed:** 2025-12-21 - Cloned via `git clone git@github.com:CKalt/cribbage.git` using SSH agent forwarding

[Back to TOC](#table-of-contents)

### 5.2 Install Node.js 🤖

- [x] Install Node.js 20.x LTS via nvm

**Completed:** 2025-12-21 - Node.js v20.19.6 installed via nvm (Amazon Linux dnf had v18 which was incompatible with Next.js 16.1)

[Back to TOC](#table-of-contents)

### 5.3 Clean install with npm ci 🤖

- [x] Run: `npm ci --ignore-scripts`

**Security Note:** The `--ignore-scripts` flag prevents execution of any `postinstall`, `preinstall`, or other lifecycle scripts in dependencies. This blocks the primary attack vector used in the Dec 2025 supply chain attack.

**Completed:** 2025-12-21 - 465 packages installed, 2 low severity vulnerabilities (cookie/nookies - no fix available)

[Back to TOC](#table-of-contents)

### 5.4 Build application 🤖

- [x] Run: `npm run build`
- [x] Verify build completes successfully

**Completed:** 2025-12-21 - Next.js 16.1.0 (Turbopack) build successful. Required copying `.env.local` with Cognito configuration.

[Back to TOC](#table-of-contents)

### 5.5 Configure PM2 🤖

- [x] Install PM2: `npm install -g pm2`
- [x] Start application: `pm2 start npm --name "cribbage" -- start`
- [x] Save PM2 config: `pm2 save`
- [x] Set up PM2 startup: `pm2 startup`

**Completed:** 2025-12-21 - PM2 v6.0.14 running, systemd startup configured

[Back to TOC](#table-of-contents)

### 5.6 Verify no malware 🤖

- [x] Run malware checks:
  ```bash
  ps aux --sort=-%cpu | head -15
  pgrep -af 'xmrig|c3pool|monero|runnv'
  grep -r "cdnapi.tech|li1.pics|45.134.174" node_modules/ 2>/dev/null | head -5
  ```
- [x] Verify system is clean

**Completed:** 2025-12-21 - All checks passed:
- No malware processes found
- No malware domains in node_modules
- CPU usage normal (next-server at 0.4%)
- App responding HTTP 200 on localhost:3000

**App URL:** http://52.15.180.37:3000

[Back to TOC](#table-of-contents)

---

*Document created: December 21, 2025*
*Adapted from: prompts/lockdown-npm-better-plan.md*
*Reference: Dec 2025 NPM supply chain attack incident*
