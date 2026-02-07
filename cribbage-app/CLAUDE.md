# Cribbage App - Claude Code Instructions

## AWS Profile
**IMPORTANT:** Always use `AWS_PROFILE=chriskoin` for AWS commands in this project.
- Account: 871816477357
- Cognito User Pool: us-east-2_7plg1ZB4F (cbydia)

## Git Permissions
For this project, Claude may perform git push and pull operations for deployment. This overrides the global rule requiring user to push/pull.

## Deployment

Claude Code handles the entire deployment stack on EC2, including git push, pull, build, and PM2 restart. Two branches are served via Nginx reverse proxy (port 80/443):

### Production
- **URL:** https://cribbage.chrisk.com
- **Branch:** `main`
- **EC2 path:** `~/cribbage/cribbage-app`
- **PM2 process:** `cribbage`
- **Deploy command:**
  ```bash
  ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com "cd cribbage && git pull && cd cribbage-app && npm run build && pm2 restart cribbage"
  ```

### Beta
- **URL:** https://beta.cribbage.chrisk.com
- **Branch:** `multiplayer`
- **EC2 path:** `~/cribbage-beta/cribbage-app`
- **PM2 process:** `cribbage-beta`
- **Deploy command:**
  ```bash
  ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com "cd cribbage-beta && git pull && cd cribbage-app && npm run build && pm2 restart cribbage-beta"
  ```

### Version Bumping
- **IMPORTANT:** Bump the version in `lib/version.js` with every deploy
- **Format:** `vX.Y.Z-bNN-YYYYMMDD` (e.g., `v0.2.1-b95-20260207`)
- Increment the build number (`bNN`) and set the date to today's date
- Update `RELEASE_NOTE` with what changed in this deploy

### Common
- **EC2 IP:** 3.132.10.219
- **SSH:** `ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@3.132.10.219`
- **Stack:** Next.js + PM2 + Nginx
- NEVER deploy to production (`cribbage`) directory when working on multiplayer beta features
