#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const PENDING_FIXES_DIR = process.env.NODE_ENV === 'production'
  ? '/var/www/cribbage/pending-fixes'
  : path.join(process.cwd(), 'pending-fixes');

async function rejectFix(fixId) {
  try {
    const filename = `fix-${fixId}.json`;
    const filepath = path.join(PENDING_FIXES_DIR, filename);
    
    // Check if fix exists
    await fs.access(filepath);
    
    // Read the fix
    const content = await fs.readFile(filepath, 'utf8');
    const fix = JSON.parse(content);
    
    // Update status
    fix.status = 'rejected';
    fix.rejectedAt = new Date().toISOString();
    fix.rejectedBy = 'Chris';
    
    // Save as rejected
    const rejectedFilename = `fix-${fixId}-rejected-${Date.now()}.json`;
    await fs.writeFile(
      path.join(PENDING_FIXES_DIR, rejectedFilename),
      JSON.stringify(fix, null, 2)
    );
    
    // Remove original
    await fs.unlink(filepath);
    
    console.log(`❌ Fix ${fixId} rejected`);
    console.log(`Claude will notify ${fix.user} that the fix was not approved.`);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`❌ Fix ${fixId} not found`);
    } else {
      console.error(`❌ Error rejecting fix: ${error.message}`);
    }
    process.exit(1);
  }
}

// Get fix ID from command line
const fixId = process.argv[2];

if (!fixId) {
  console.error('Usage: npm run reject-fix <fix-id>');
  process.exit(1);
}

rejectFix(fixId);