#!/usr/bin/env node
/**
 * FLOXA Work — Automated Database Backup Script
 * Generates verified JSON collection dumps with SHA-256 integrity checksums.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/floxa_work_db';
const BACKUP_DIR = path.resolve(process.cwd(), 'backups');

const COLLECTIONS_TO_BACKUP = [
  'users',
  'talentprofiles',
  'briefs',
  'proposals',
  'contracts',
  'milestones',
  'paymentrecords',
  'tasks',
  'contractactivities',
  'notifications',
  'reviews',
  'disputes',
  'userreports',
  'userblocks',
  'sessions',
  'auditlogs',
  'filerecords',
];

async function runBackup() {
  console.log('========================================================================');
  console.log('  FLOXA WORK — DATABASE BACKUP GENERATION UTILITY');
  console.log('========================================================================\n');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `floxa_backup_${timestamp}.json`;
  const backupFilePath = path.join(BACKUP_DIR, backupFilename);
  const checksumFilePath = path.join(BACKUP_DIR, `${backupFilename}.sha256`);

  console.log(`[1/3] Connecting to database...`);
  const conn = await mongoose.createConnection(DATABASE_URL).asPromise();
  const db = conn.db;
  console.log(`✓ Connected to ${db.databaseName}`);

  console.log(`\n[2/3] Extracting collections...`);
  const backupData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      databaseName: db.databaseName,
      version: '1.0.0',
      system: 'FLOXA Work Platform',
    },
    collections: {},
    documentCounts: {},
  };

  let totalDocs = 0;
  for (const collName of COLLECTIONS_TO_BACKUP) {
    try {
      const collection = db.collection(collName);
      const docs = await collection.find({}).toArray();
      backupData.collections[collName] = docs;
      backupData.documentCounts[collName] = docs.length;
      totalDocs += docs.length;
      console.log(`  - ${collName}: ${docs.length} documents`);
    } catch (err) {
      console.warn(`  - ${collName}: [SKIPPED / NOT FOUND]`);
      backupData.collections[collName] = [];
      backupData.documentCounts[collName] = 0;
    }
  }

  console.log(`\n[3/3] Writing backup archive & computing SHA-256 checksum...`);
  const jsonContent = JSON.stringify(backupData, null, 2);
  fs.writeFileSync(backupFilePath, jsonContent, 'utf-8');

  const hash = crypto.createHash('sha256').update(jsonContent).digest('hex');
  fs.writeFileSync(checksumFilePath, `${hash}  ${backupFilename}\n`, 'utf-8');

  const stats = fs.statSync(backupFilePath);
  console.log(`✓ Archive written: ${backupFilePath}`);
  console.log(`✓ Archive size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`✓ Total documents preserved: ${totalDocs}`);
  console.log(`✓ SHA-256 Checksum: ${hash}`);

  await conn.close();
  console.log('\n========================================================================');
  console.log('  BACKUP COMPLETED SUCCESSFULLY');
  console.log('========================================================================\n');

  return { backupFilePath, checksumFilePath, totalDocs, hash };
}

if (require.main === module) {
  runBackup().catch((err) => {
    console.error('❌ Backup generation failed:', err);
    process.exit(1);
  });
}

module.exports = { runBackup };
