/**
 * One-time (idempotent) backfill for the enterprise RBAC feature.
 *
 * For every existing Organization:
 *   - ensures one default shared "Main" project exists.
 *   - ensures the Account Owner (Organization.owner) and every existing
 *     accepted org member (Organization.members[]) has a personal project.
 *
 * Safe to re-run: every step checks for an existing document before creating
 * one. Does not touch Organization.members[] or any existing Link/QR/Domain
 * data — additive only.
 *
 * Usage:
 *   node -r dotenv/config scripts/backfillProjects.js
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

const Organization = require('../src/models/Organization');
const Project = require('../src/models/Project');
const projectAccessService = require('../src/services/projectAccessService');

async function backfillOrganization(organization) {
  let mainProject = await Project.findOne({ organization: organization._id, isPersonal: false });
  if (!mainProject) {
    mainProject = await Project.create({
      organization: organization._id,
      name: 'Main',
      isPersonal: false
    });
    console.log(`  created default project "Main" (${mainProject._id})`);
  }

  const memberUserIds = new Set([organization.owner.toString()]);
  for (const member of organization.members || []) {
    memberUserIds.add(member.user.toString());
  }

  for (const userId of memberUserIds) {
    const personalProject = await projectAccessService.createPersonalProject(userId, organization._id);
    console.log(`  personal project ready for user ${userId}: ${personalProject._id}`);
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const organizations = await Organization.find({});
  console.log(`Found ${organizations.length} organization(s)`);

  for (const organization of organizations) {
    console.log(`Backfilling organization ${organization.name} (${organization._id})`);
    await backfillOrganization(organization);
  }

  console.log('Backfill complete.');
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
