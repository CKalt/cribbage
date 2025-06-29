#!/bin/bash

# EC2 Setup Script for Cribbage Game with Claude Code Integration

echo "Setting up Cribbage Game on EC2..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx for reverse proxy
sudo apt-get install -y nginx

# Install screen for Claude Code session
sudo apt-get install -y screen

# Create app directory
sudo mkdir -p /var/www/cribbage
sudo chown -R ubuntu:ubuntu /var/www/cribbage

# Clone or copy the app (adjust based on your repo)
cd /var/www/cribbage
# git clone <your-repo> . # or copy files

# Install dependencies
npm install

# Build the Next.js app
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cribbage-game',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/cribbage',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/cribbage-error.log',
    out_file: '/var/log/pm2/cribbage-out.log',
    merge_logs: true,
    time: true
  }]
}
EOF

# Configure nginx
sudo tee /etc/nginx/sites-available/cribbage << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for hot reload (dev mode)
    location /_next/webpack-hmr {
        proxy_pass http://localhost:3000/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/cribbage /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Start the app with PM2
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "Setup complete! The app should be running on port 80"