#!/usr/bin/env node

/**
 * Claude Code Monitor for Cribbage Game
 * This script monitors the game for bug reports and manages the approval/deployment process
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const FEEDBACK_DIR = '/var/www/cribbage/feedback';
const PENDING_FIXES_DIR = '/var/www/cribbage/pending-fixes';
const LOG_FILE = '/var/log/claude-monitor.log';

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(FEEDBACK_DIR, { recursive: true });
  await fs.mkdir(PENDING_FIXES_DIR, { recursive: true });
}

// Log function
async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  await fs.appendFile(LOG_FILE, logMessage);
}

// Watch for new feedback
async function watchFeedback() {
  await log('Claude Monitor started - watching for feedback...');
  
  // Check for new feedback files every 30 seconds
  setInterval(async () => {
    try {
      const files = await fs.readdir(FEEDBACK_DIR);
      const feedbackFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.processed.json'));
      
      for (const file of feedbackFiles) {
        await processFeedback(file);
      }
    } catch (error) {
      await log(`Error checking feedback: ${error.message}`);
    }
  }, 30000);
}

// Process feedback and create fix
async function processFeedback(filename) {
  const filepath = path.join(FEEDBACK_DIR, filename);
  
  try {
    const content = await fs.readFile(filepath, 'utf8');
    const feedback = JSON.parse(content);
    
    await log(`Processing feedback from ${feedback.user}: ${feedback.issue}`);
    
    // Create a fix proposal
    const fix = {
      id: Date.now(),
      user: feedback.user,
      issue: feedback.issue,
      proposedFix: generateFix(feedback),
      status: 'pending_approval',
      createdAt: new Date().toISOString()
    };
    
    // Save fix for approval
    await fs.writeFile(
      path.join(PENDING_FIXES_DIR, `fix-${fix.id}.json`),
      JSON.stringify(fix, null, 2)
    );
    
    // Mark feedback as processed
    await fs.rename(filepath, filepath.replace('.json', '.processed.json'));
    
    await log(`Created fix proposal ${fix.id} for approval`);
    
    // Notify Chris
    await notifyChris(fix);
    
  } catch (error) {
    await log(`Error processing feedback ${filename}: ${error.message}`);
  }
}

// Generate fix based on feedback (simplified - in reality would analyze the issue)
function generateFix(feedback) {
  // This is where Claude would analyze the issue and generate actual code fixes
  return {
    description: `Fix for: ${feedback.issue}`,
    files: [{
      path: '/components/CribbageGame.tsx',
      changes: 'Proposed changes based on the issue...'
    }]
  };
}

// Notify Chris about pending fix
async function notifyChris(fix) {
  await log(`
============================================
ATTENTION CHRIS: Bug Report from ${fix.user}
============================================
Issue: ${fix.issue}

Proposed Fix: ${fix.proposedFix.description}

To approve, run: npm run approve-fix ${fix.id}
To reject, run: npm run reject-fix ${fix.id}
============================================
  `);
}

// Check for approved fixes
async function checkApprovedFixes() {
  setInterval(async () => {
    try {
      const files = await fs.readdir(PENDING_FIXES_DIR);
      const approvedFiles = files.filter(f => f.includes('-approved-'));
      
      for (const file of approvedFiles) {
        await deployFix(file);
      }
    } catch (error) {
      await log(`Error checking approved fixes: ${error.message}`);
    }
  }, 10000);
}

// Deploy approved fix
async function deployFix(filename) {
  const filepath = path.join(PENDING_FIXES_DIR, filename);
  
  try {
    const content = await fs.readFile(filepath, 'utf8');
    const fix = JSON.parse(content);
    
    await log(`Deploying fix ${fix.id}...`);
    
    // In production, this would apply the actual code changes
    // For now, we'll simulate the deployment
    await execPromise('cd /var/www/cribbage && npm run build');
    await execPromise('pm2 reload cribbage-game');
    
    // Notify the user
    await notifyUser(fix.user, `Your reported issue "${fix.issue}" has been fixed and deployed!`);
    
    // Archive the fix
    await fs.rename(filepath, filepath.replace('-approved-', '-deployed-'));
    
    await log(`Fix ${fix.id} deployed successfully`);
    
  } catch (error) {
    await log(`Error deploying fix from ${filename}: ${error.message}`);
  }
}

// Notify user (simplified - would integrate with your notification system)
async function notifyUser(user, message) {
  await log(`Notification to ${user}: ${message}`);
  // In production, this would send actual notification
}

// Main function
async function main() {
  await ensureDirectories();
  await watchFeedback();
  await checkApprovedFixes();
  
  // Keep the process running
  process.on('SIGINT', async () => {
    await log('Claude Monitor shutting down...');
    process.exit(0);
  });
}

// Start the monitor
main().catch(async (error) => {
  await log(`Fatal error: ${error.message}`);
  process.exit(1);
});