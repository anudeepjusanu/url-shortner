/**
 * One-time (idempotent) backfill for enterprise RBAC data scoping.
 *
 * Before this runs, every existing Link/QR code/Custom domain/Dynamic QR
 * code that belongs to an enterprise Organization has an `organization`
 * field but no `project` field — there is no way to tell which project it
 * belongs to, so per-project role enforcement can't apply to it yet.
 *
 * For every existing Organization, this assigns every such untagged
 * resource to that org's default shared "Main" project (the same project
 * scripts/backfillProjects.js creates/reuses).
 *
 * Safe to re-run: only touches documents where `project` is still unset, so
 * resources created after project-scoping went live (which already carry a
 * real project) are left untouched.
 *
 * Usage:
 *   node -r dotenv/config scripts/backfillResourceProjects.js
 *
 * Run scripts/backfillProjects.js first (or let this script create the
 * Main project itself, which it does if one doesn't exist yet).
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
const Url = require('../src/models/Url');
const Domain = require('../src/models/Domain');
const QRCode = require('../src/models/QRCode');
const DynamicQRCode = require('../src/models/DynamicQRCode');

async function getOrCreateMainProject(organization) {
  let mainProject = await Project.findOne({ organization: organization._id, isPersonal: false });
  if (!mainProject) {
    mainProject = await Project.create({
      organization: organization._id,
      name: 'Main',
      isPersonal: false
    });
    console.log(`  created default project "Main" (${mainProject._id})`);
  }
  return mainProject;
}

async function backfillOrganization(organization) {
  const mainProject = await getOrCreateMainProject(organization);
  const filter = { organization: organization._id, project: null };
  const update = { $set: { project: mainProject._id } };

  const [urls, domains, qrCodes, dynamicQrCodes] = await Promise.all([
    Url.updateMany(filter, update),
    Domain.updateMany(filter, update),
    QRCode.updateMany(filter, update),
    DynamicQRCode.updateMany(filter, update)
  ]);

  console.log(
    `  assigned to "${mainProject.name}": ${urls.modifiedCount} link(s), ` +
    `${domains.modifiedCount} domain(s), ${qrCodes.modifiedCount} QR code(s), ` +
    `${dynamicQrCodes.modifiedCount} dynamic QR code(s)`
  );
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const organizations = await Organization.find({});
  console.log(`Found ${organizations.length} organization(s)`);

  for (const organization of organizations) {
    console.log(`Backfilling resource projects for organization ${organization.name} (${organization._id})`);
    await backfillOrganization(organization);
  }

  console.log('Backfill complete.');
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
