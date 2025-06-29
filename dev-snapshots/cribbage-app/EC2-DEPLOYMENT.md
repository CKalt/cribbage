# EC2 Deployment with Claude Code Integration

This guide explains how to deploy the Cribbage game to EC2 with Claude Code monitoring and live bug fix capabilities.

## Architecture Overview

1. **Cribbage Game** - Next.js app running on EC2 via PM2
2. **Claude Monitor** - Node.js process running in a screen session that:
   - Monitors bug reports from users
   - Creates fix proposals
   - Notifies you (Chris) for approval
   - Deploys approved fixes automatically
3. **Feedback System** - In-game button for users to report bugs directly to Claude

## Deployment Steps

### 1. Launch EC2 Instance

Launch an Ubuntu 22.04 LTS instance with:
- At least t3.small (2GB RAM recommended)
- Security group allowing ports 22 (SSH) and 80 (HTTP)
- Elastic IP for consistent access

### 2. Initial Setup

SSH into your instance and clone/copy the app:

```bash
# Clone your repo or copy files
scp -r ./cribbage-app ubuntu@your-ec2-ip:/home/ubuntu/

# SSH into the instance
ssh ubuntu@your-ec2-ip

# Move to the app directory
cd cribbage-app

# Run the setup script
bash deployment/setup-ec2.sh
```

### 3. Start Claude Monitor

Start the Claude monitor in a screen session:

```bash
npm run start-monitor
```

This creates a screen session called `claude-monitor`. You can:
- Attach to it: `screen -r claude-monitor`
- Detach: `Ctrl+A` then `D`
- Check if running: `screen -list`

### 4. How the System Works

#### When a User Reports a Bug:

1. User clicks "Report Bug to Claude" button in the game
2. Fills out the form with their name and issue description
3. Feedback is saved to `/feedback` directory
4. Claude Monitor detects the new feedback and analyzes it

#### Claude's Response:

Claude will:
1. Process the bug report
2. Generate a proposed fix
3. Save it to `/pending-fixes`
4. Notify you in the screen session:

```
============================================
ATTENTION CHRIS: Bug Report from Kandi
============================================
Issue: Cards sometimes disappear during pegging

Proposed Fix: Fix validation in pegging phase

To approve, run: npm run approve-fix 1234567890
To reject, run: npm run reject-fix 1234567890
============================================
```

#### Your Approval Process:

When you see a notification:

1. Review the issue and proposed fix
2. If you approve:
   ```bash
   npm run approve-fix 1234567890
   ```
3. If you reject:
   ```bash
   npm run reject-fix 1234567890
   ```

#### After Approval:

1. Claude deploys the fix automatically
2. Rebuilds the Next.js app
3. Reloads PM2 process (zero downtime)
4. Notifies the user that their issue is fixed

## Monitoring and Logs

### View Application Logs:
```bash
pm2 logs cribbage-game
```

### View Claude Monitor Logs:
```bash
tail -f /var/log/claude-monitor.log
```

### Check Application Status:
```bash
pm2 status
```

### Restart Application:
```bash
pm2 restart cribbage-game
```

## Interactive Claude Session

When attached to the Claude monitor screen session (`screen -r claude-monitor`), you'll see real-time:
- Bug reports as they come in
- Fix proposals
- Deployment status
- User notifications

Claude will communicate with you through this screen session, asking for approval before making any changes.

## Example Workflow

1. **Kandi** is playing and notices the count is wrong during pegging
2. She clicks "Report Bug to Claude" and describes the issue
3. **Claude** (in the screen session) says:
   ```
   Hey Chris, Kandi was just playing and discovered a bug in the pegging count calculation. 
   I'd like to fix the calculatePeggingScore function to properly handle runs.
   This will affect lines 145-210 in CribbageGame.tsx.
   Is that okay?
   ```
4. **You** run: `npm run approve-fix 1234567890`
5. **Claude** deploys the fix and tells Kandi:
   ```
   Chris has approved the fix! The pegging count issue has been resolved and deployed.
   ```

## Security Notes

- The feedback API only accepts bug reports, no code execution
- All fixes require manual approval before deployment
- Claude only has access to modify application code, not system files
- PM2 runs as the ubuntu user, not root

## Backup and Recovery

Before each deployment, Claude creates backups:
```bash
ls /var/www/cribbage/backups/
```

To rollback:
```bash
pm2 stop cribbage-game
cp -r /var/www/cribbage/backups/backup-TIMESTAMP/* /var/www/cribbage/
pm2 start cribbage-game
```