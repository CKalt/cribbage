# Cribbage App - Claude Code Instructions

## AWS Profile
**IMPORTANT:** Always use `AWS_PROFILE=chriskoin` for AWS commands in this project.
- Account: 871816477357
- Cognito User Pool: us-east-2_7plg1ZB4F (cbydia)

## Git Permissions
For this project, Claude may perform git push and pull operations for deployment. This overrides the global rule requiring user to push/pull.

**SSH Key:** The repo uses `github-ckalt.com` as the remote host (configured in ~/.ssh/config). If push fails with permission denied, run:
```bash
ssh-add ~/.ssh/id_ed25519
```
to load the correct CKalt GitHub SSH key before pushing.

## Deployment
- EC2 IP: 3.132.10.219
- Domain: cribbage.chrisk.com
- SSH: `ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@3.132.10.219`
- Deploy: `ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com "cd cribbage && git pull && cd cribbage-app && npm run build && pm2 restart cribbage"`
- App runs via PM2 on port 3000
- Nginx reverse proxy on port 80/443
