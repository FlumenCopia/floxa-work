#!/usr/bin/env node
/**
 * FLOXA Work — Automated Database Restoration & Verification Script
 * Restores collections to an isolated target database with SHA-256 checksum verification.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function runRestore(options = {}) {
  const archivePath = options.archivePath;
  const targetDbUrl = options.targetDbUrl || 'mongodb://127.0.0.1:27017/floxa_work_db_restore_test';

  console.log('========================================================================');
  console.log('  FLOXA WORK — DATABASE RESTORATION UTILITY');
  console.log('========================================================================\n');

  if (!archivePath || !fs.existsSync(archivePath)) {
    throw new Error(`Specified backup archive does not exist: ${archivePath}`);
  }

  // Safety constraint: Never restore to default production database url without explicit override
  if (targetDbUrl.includes('floxa_work_prod') && !process.env.CONFIRM_PRODUCTION_RESTORE) {
    throw new Error('SAFETY BLOCK: Destructive restore against production requires CONFIRM_PRODUCTION_RESTORE=true');
  }

  console.log(`[1/4] Verifying SHA-256 checksum...`);
  const archiveContent = fs.readFileSync(archivePath, 'utf-8');
  const computedHash = crypto.createHash('sha256').update(archiveContent).digest('hex');

  const checksumPath = `${archivePath}.sha256`;
  if (fs.existsSync(checksumPath)) {
    const expectedChecksum = fs.readFileSync(checksumPath, 'utf-8').trim().split(/\s+/)[0];
    if (computedHash !== expectedChecksum) {
      throw new Error(`Checksum mismatch! File corrupted. Expected: ${expectedChecksum}, Computed: ${computedHash}`);
    }
    console.log(`✓ Checksum matches: ${computedHash}`);
  } else {
    console.log(`ℹ No .sha256 file found. Computed hash: ${computedHash}`);
  }

  console.log(`\n[2/4] Parsing backup archive metadata...`);
  const backupData = JSON.parse(archiveContent);
  console.log(`✓ Backup generated at: ${backupData.metadata.generatedAt}`);
  console.log(`✓ Origin database: ${backupData.metadata.databaseName}`);

  console.log(`\n[3/4] Connecting to target database: ${targetDbUrl}...`);
  const conn = await mongoose.createConnection(targetDbUrl).asPromise();
  const db = conn.db;
  console.log(`✓ Connected to restoration target: ${db.databaseName}`);

  console.log(`\n[4/4] Restoring collections to target database...`);
  let totalRestoredDocs = 0;

  for (const [collName, docs] of Object.entries(backupData.collections)) {
    if (!Array.isArray(docs) || docs.length === 0) continue;

    const collection = db.collection(collName);
    // Clear test collection prior to restore
    await collection.deleteMany({});

    // Transform string ObjectIds back if needed, or insert raw
    await collection.insertMany(docs);
    const restoredCount = await collection.countDocuments({});
    console.log(`  - ${collName}: Restored ${restoredCount} documents`);
    totalRestoredDocs += restoredCount;
  }

  console.log(`\n✓ Restoration verified! Total documents restored: ${totalRestoredDocs}`);
  await conn.close();

  console.log('\n========================================================================');
  console.log('  RESTORATION TEST COMPLETED SUCCESSFULLY');
  console.log('========================================================================\n');

  return { totalRestoredDocs, targetDatabase: db.databaseName, hash: computedHash };
}

if (require.main === module) {
  // Parse CLI arguments if executed directly
  const args = process.argv.slice(2);
  let archive = '';
  let target = '';

  for (const arg of args) {
    if (arg.startsWith('--archive=')) archive = arg.split('=')[1];
    if (arg.startsWith('--targetDb=')) target = arg.split('=')[1];
  }

  // Find latest backup if archive not passed
  if (!archive) {
    const backupDir = path.resolve(process.cwd(), 'backups');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json'));
      if (files.length > 0) {
        archive = path.join(backupDir, files.sort().reverse()[0]);
      }
    }
  }

  runRestore({ archivePath: archive, targetDbUrl: target }).catch((err) => {
    console.error('❌ Restoration failed:', err);
    process.exit(1);
  });
}

module.exports = { runRestore };
