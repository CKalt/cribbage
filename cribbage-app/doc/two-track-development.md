# Two-Track Development Workflow

This document explains how to manage parallel development of the Cribbage app across two tracks:

| Track | Branch | URL | PM2 Process |
|-------|--------|-----|-------------|
| **Production** | `main` | cribbage.chrisk.com | `cribbage` |
| **Beta** | `multiplayer` | beta.cribbage.chrisk.com | `cribbage-beta` |

---

## Table of Contents

- [Overview](#overview)
- [Switching Between Tracks](#switching-between-tracks)
- [Deployment Commands](#deployment-commands)
- [Bug Report Workflow](#bug-report-workflow)
- [Prompt Templates](#prompt-templates)
- [Session Start Checklist](#session-start-checklist)

---

## Overview

The cribbage app runs two separate instances on the EC2 server:

1. **Production (main branch)**: Stable release at cribbage.chrisk.com
   - Bug reports in: `bug-reports/` directory
   - Version tracked in: `lib/version.js`
   - Focus: Stability, bug fixes, user-reported issues

2. **Beta (multiplayer branch)**: Feature development at beta.cribbage.chrisk.com
   - Bug reports in: `bug-reports/beta/` directory
   - Version tracked in: `lib/version.js` (separate from main)
   - Focus: New multiplayer features, experimental changes

---

## Switching Between Tracks

### Switch to Production (main branch)
```bash
git checkout main
```

### Switch to Beta (multiplayer branch)
```bash
git checkout multiplayer
```

### Check Current Branch
```bash
git branch --show-current
```

---

## Deployment Commands

### Deploy to Production (cribbage.chrisk.com)
Ensure you're on the `main` branch, then:
```bash
ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com "cd cribbage && git checkout main && git pull && cd cribbage-app && npm run build && pm2 restart cribbage"
```

### Deploy to Beta (beta.cribbage.chrisk.com)
Ensure you're on the `multiplayer` branch, then:
```bash
ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com "cd cribbage-beta && git checkout multiplayer && git pull && cd cribbage-app && npm run build && pm2 restart cribbage-beta"
```

### SSH Key Note
If push fails with "Permission denied", load the correct SSH key:
```bash
ssh-add ~/.ssh/id_ed25519
```

---

## Bug Report Workflow

### Production Bug Reports
Location: `/Users/chris/projects/cribbage/cribbage-app/bug-reports/`

To check for new production bugs:
```bash
ls -la bug-reports/*.md
```

### Beta Bug Reports
Location: `/Users/chris/projects/cribbage/cribbage-app/bug-reports/beta/`

To check for new beta bugs:
```bash
ls -la bug-reports/beta/*.md
```

### Bug Report Format
Bug reports are markdown files with:
- Title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (when applicable)
- Status tracking

---

## Prompt Templates

Use these prompts to maintain a consistent workflow loop:

### Start of Session - Check Both Tracks
```
Check the current git branch and status. Then check for any new bug reports
in both bug-reports/ (production) and bug-reports/beta/ (beta). Summarize
what needs attention on each track.
```

### Work on Production Bugs
```
Switch to the main branch and address production bug reports in bug-reports/.
After fixing, bump the version appropriately and deploy to cribbage.chrisk.com.
```

### Work on Beta Features
```
Switch to the multiplayer branch and continue beta development. Check
bug-reports/beta/ for any issues. After changes, deploy to beta.cribbage.chrisk.com.
```

### Deploy Production Fix
```
I've approved the production fix. Please commit, push, and deploy to
cribbage.chrisk.com, then update the bug report status.
```

### Deploy Beta Update
```
Please commit, push, and deploy the beta changes to beta.cribbage.chrisk.com.
```

### End of Session Summary
```
Summarize what was accomplished on each track (production and beta),
any remaining bugs, and what should be prioritized next session.
```

---

## Session Start Checklist

At the start of each development session:

1. **Check current branch**: `git branch --show-current`
2. **Check git status**: `git status`
3. **Review production bugs**: `ls bug-reports/*.md`
4. **Review beta bugs**: `ls bug-reports/beta/*.md`
5. **Decide which track to work on first** based on priorities

### Priority Guidelines

| Priority | When to Work on Production | When to Work on Beta |
|----------|---------------------------|---------------------|
| High | User-reported blocking bugs | Critical feature completion |
| Medium | UX improvements | New feature development |
| Low | Minor polish | Experimental features |

Production stability takes precedence over beta features when users report issues.

---

## Merging Beta to Production

When multiplayer features are ready for production:

1. Ensure all beta bugs are resolved
2. Test thoroughly on beta.cribbage.chrisk.com
3. Create a merge plan document
4. Merge multiplayer branch into main
5. Deploy to production
6. Update version numbers appropriately

---

## Quick Reference

| Action | Command |
|--------|---------|
| Switch to production | `git checkout main` |
| Switch to beta | `git checkout multiplayer` |
| Check branch | `git branch --show-current` |
| Deploy production | See deployment command above |
| Deploy beta | See deployment command above |
| Load SSH key | `ssh-add ~/.ssh/id_ed25519` |
