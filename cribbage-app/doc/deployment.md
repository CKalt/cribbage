# Cribbage App - Deployment Documentation

## Table of Contents

- [Overview](#overview)
- [Infrastructure](#infrastructure)
- [Access](#access)
  - [SSH Access](#ssh-access)
  - [Web Access](#web-access)
- [AWS Resources](#aws-resources)
  - [EC2 Instance](#ec2-instance)
  - [Security Group](#security-group)
  - [Elastic IP](#elastic-ip)
- [Application Stack](#application-stack)
- [PM2 Process Management](#pm2-process-management)
- [Nginx Configuration](#nginx-configuration)
- [SSL Certificate](#ssl-certificate)
- [Environment Variables](#environment-variables)
- [Common Operations](#common-operations)
  - [Restarting the Application](#restarting-the-application)
  - [Viewing Logs](#viewing-logs)
  - [Deploying Updates](#deploying-updates)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Cribbage App is a Next.js application deployed on AWS EC2 with nginx as a reverse proxy and Let's Encrypt SSL.

**Live URL:** https://cribbage.chrisk.com

---

## Infrastructure

| Component | Details |
|-----------|---------|
| Cloud Provider | AWS (chriskoin profile) |
| Region | us-east-2 (Ohio) |
| Instance Type | t3.small (2 vCPU, 2 GB RAM) |
| OS | Amazon Linux 2023 |
| Node.js | v20.19.6 (via nvm) |
| Process Manager | PM2 v6.0.14 |
| Web Server | nginx 1.28.0 |
| SSL | Let's Encrypt (certbot) |

---

## Access

### SSH Access

```bash
ssh -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@3.132.10.219
```

Or using domain:
```bash
ssh -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com
```

**Note:** SSH access is restricted to specific IP addresses via security group. If your IP changes, update the security group rules.

### Web Access

| URL | Description |
|-----|-------------|
| https://cribbage.chrisk.com | Production (HTTPS) |
| http://cribbage.chrisk.com | Redirects to HTTPS |

---

## AWS Resources

### EC2 Instance

| Property | Value |
|----------|-------|
| Instance ID | `i-019e6bfe19d70a54f` |
| Instance Type | t3.small |
| AMI | Amazon Linux 2023 (`ami-0e858a9b9fb8b4917`) |
| Key Pair | chriskoin2-key-pair |
| Availability Zone | us-east-2 |

### Security Group

| Property | Value |
|----------|-------|
| Group ID | `sg-0e266eb1426434f9a` |
| Group Name | cribbage-sg |

**Inbound Rules:**

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 22 | TCP | Your IP | SSH access |
| 80 | TCP | 0.0.0.0/0 | HTTP (redirects to HTTPS) |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 3000 | TCP | Your IP | Direct Next.js access (optional) |

### Elastic IP

| Property | Value |
|----------|-------|
| Public IP | `3.132.10.219` |
| Allocation ID | `eipalloc-01d86fa15e62562e8` |
| Association ID | `eipassoc-047ff365a3cf83ac4` |

---

## Application Stack

| Layer | Technology | Port |
|-------|------------|------|
| Reverse Proxy | nginx | 80, 443 |
| Application | Next.js 16.1.0 | 3000 |
| Process Manager | PM2 | - |
| Runtime | Node.js 20.19.6 | - |

**Application Path:** `/home/ec2-user/cribbage/cribbage-app`

---

## PM2 Process Management

PM2 manages the Next.js application and ensures it restarts on crashes or reboots.

```bash
# Check status
pm2 status

# View logs
pm2 logs cribbage

# Restart application
pm2 restart cribbage

# Stop application
pm2 stop cribbage

# Start application
pm2 start cribbage

# Save current process list (for reboot persistence)
pm2 save
```

**PM2 Startup:** Configured via systemd (`pm2-ec2-user.service`)

---

## Nginx Configuration

**Config File:** `/etc/nginx/conf.d/cribbage.conf`

```nginx
server {
    server_name cribbage.chrisk.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/cribbage.chrisk.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cribbage.chrisk.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = cribbage.chrisk.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name cribbage.chrisk.com;
    return 404;
}
```

**Nginx Commands:**
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## SSL Certificate

| Property | Value |
|----------|-------|
| Provider | Let's Encrypt |
| Domain | cribbage.chrisk.com |
| Certificate Path | `/etc/letsencrypt/live/cribbage.chrisk.com/fullchain.pem` |
| Private Key Path | `/etc/letsencrypt/live/cribbage.chrisk.com/privkey.pem` |
| Expiration | March 21, 2026 |
| Auto-Renewal | Enabled (certbot-renew.timer) |

**Manual Renewal (if needed):**
```bash
sudo certbot renew
```

**Check Renewal Timer:**
```bash
sudo systemctl status certbot-renew.timer
```

---

## Environment Variables

Environment variables are stored in `/home/ec2-user/cribbage/cribbage-app/.env.local`

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_COGNITO_REGION | AWS Cognito region |
| NEXT_PUBLIC_COGNITO_USER_POOL_ID | Cognito User Pool ID |
| NEXT_PUBLIC_COGNITO_CLIENT_ID | Cognito App Client ID |

---

## Common Operations

### Restarting the Application

```bash
# SSH into server
ssh -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@3.132.10.219

# Restart via PM2
pm2 restart cribbage
```

### Viewing Logs

```bash
# Application logs
pm2 logs cribbage

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Deploying Updates

**From your Mac:**

1. Commit and push changes:
   ```bash
   git add <files>
   git commit -m "your message"
   git push
   ```

2. Deploy via SSH with agent forwarding (one-liner):
   ```bash
   ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com \
     "cd cribbage && git pull && cd cribbage-app && npm run build && pm2 restart cribbage"
   ```

   **Important:** The `-A` flag enables SSH agent forwarding, which allows the EC2 instance to use your Mac's SSH key for GitHub authentication. Without it, `git pull` will fail.

3. If package.json changed, reinstall dependencies first:
   ```bash
   ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com \
     "cd cribbage/cribbage-app && npm ci --ignore-scripts && npm run build && pm2 restart cribbage"
   ```

**Security Note:** Always use `npm ci --ignore-scripts` to prevent malware execution from compromised packages.

---

## Security Notes

1. **NPM Lockdown:** All dependencies are pinned to exact versions (no `^` prefixes) to prevent supply chain attacks.

2. **Install Scripts Disabled:** Always use `npm ci --ignore-scripts` when installing packages on the server.

3. **SSH Access:** Restricted to specific IP addresses. Update security group if your IP changes:
   ```bash
   aws ec2 authorize-security-group-ingress --profile chriskoin \
     --group-id sg-0e266eb1426434f9a \
     --protocol tcp --port 22 --cidr YOUR_IP/32
   ```

4. **Swap Space:** 2GB swap configured for build stability.

5. **Malware Checks:** After any `npm install`, verify no malicious processes:
   ```bash
   ps aux --sort=-%cpu | head -15
   pgrep -af 'xmrig|c3pool|monero'
   ```

---

## Troubleshooting

### App Not Responding

1. Check PM2 status:
   ```bash
   pm2 status
   pm2 logs cribbage --lines 50
   ```

2. Check nginx:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. Check if port 3000 is listening:
   ```bash
   curl http://localhost:3000
   ```

### SSH Connection Refused

Your IP may have changed. Update the security group:
```bash
# Get your current IP
curl https://checkip.amazonaws.com

# Add to security group (from Mac)
aws ec2 authorize-security-group-ingress --profile chriskoin \
  --group-id sg-0e266eb1426434f9a \
  --protocol tcp --port 22 --cidr YOUR_NEW_IP/32
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Reload nginx after renewal
sudo systemctl reload nginx
```

### Out of Memory During Build

The instance has 2GB RAM + 2GB swap. If builds fail:
```bash
# Check memory
free -h

# Check swap
swapon --show
```

---

*Document created: December 21, 2025*
*Last updated: December 21, 2025*
