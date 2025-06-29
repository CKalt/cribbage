#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const PENDING_FIXES_DIR = process.env.NODE_ENV === 'production'
  ? '/var/www/cribbage/pending-fixes'
  : path.join(process.cwd(), 'pending-fixes');

async function approveFix(fixId) {
  try {
    const filename = `fix-${fixId}.json`;
    const filepath = path.join(PENDING_FIXES_DIR, filename);
    
    // Check if fix exists
    await fs.access(filepath);
    
    // Read the fix
    const content = await fs.readFile(filepath, 'utf8');
    const fix = JSON.parse(content);
    
    // Update status
    fix.status = 'approved';
    fix.approvedAt = new Date().toISOString();
    fix.approvedBy = 'Chris';
    
    // Save as approved
    const approvedFilename = `fix-${fixId}-approved-${Date.now()}.json`;
    await fs.writeFile(
      path.join(PENDING_FIXES_DIR, approvedFilename),
      JSON.stringify(fix, null, 2)
    );
    
    // Remove original
    await fs.unlink(filepath);
    
    console.log(`✅ Fix ${fixId} approved!`);
    console.log(`Claude will now deploy the fix and notify ${fix.user}.`);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`❌ Fix ${fixId} not found`);
    } else {
      console.error(`❌ Error approving fix: ${error.message}`);
    }
    process.exit(1);
  }
}

// Get fix ID from command line
const fixId = process.argv[2];

if (!fixId) {
  console.error('Usage: npm run approve-fix <fix-id>');
  process.exit(1);
}

approveFix(fixId);