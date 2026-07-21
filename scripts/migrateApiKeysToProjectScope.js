/**
 * One-time (idempotent) migration for the API-key-per-project change.
 *
 * Before this runs, API keys were scoped per (user, project) pair, so a
 * project with multiple editors/admins could have several *active* keys —
 * one per user who had ever generated one. Now a key is scoped to the
 * project alone (`ApiKey.findOne({ project, isActive: true })`), so at most
 * one active key per project must exist or lookups become non-deterministic.
 *
 * For every project with more than one active key, this keeps the most
 * recently created one and deactivates the rest. Solo-account keys
 * (project: null, scoped by user) are untouched — that scope hasn't changed.
 *
 * Safe to re-run: a project that already has zero or one active key is left
 * alone.
 *
 * Usage:
 *   node -r dotenv/config scripts/migrateApiKeysToProjectScope.js
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is not set.');
  process.exit(1);
}

const ApiKey = require('../src/models/ApiKey');

async function collapseProject(projectId) {
  const activeKeys = await ApiKey.find({ project: projectId, isActive: true }).sort({
    createdAt: -1
  });
  if (activeKeys.length <= 1) return 0;

  const [keep, ...rest] = activeKeys;
  await ApiKey.updateMany(
    { _id: { $in: rest.map((k) => k._id) } },
    { $set: { isActive: false } }
  );
  console.log(
    `  project ${projectId}: kept key ${keep._id} (created ${keep.createdAt.toISOString()}), ` +
    `deactivated ${rest.length} older active key(s)`
  );
  return rest.length;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const projectIds = await ApiKey.distinct('project', {
    project: { $ne: null },
    isActive: true
  });
  console.log(`Found ${projectIds.length} project(s) with an active API key`);

  let totalDeactivated = 0;
  for (const projectId of projectIds) {
    totalDeactivated += await collapseProject(projectId);
  }

  console.log(`Migration complete. Deactivated ${totalDeactivated} duplicate key(s).`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
