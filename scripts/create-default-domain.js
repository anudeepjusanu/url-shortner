#!/usr/bin/env node

// Script to create a default domain entry for laghhu.link
const mongoose = require('mongoose');
require('dotenv').config();

const domainSchema = new mongoose.Schema({
  domain: String,
  subdomain: String,
  fullDomain: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  status: String,
  verificationStatus: String,
  isDefault: Boolean,
  cnameTarget: String,
  verificationRecord: {
    type: String,
    name: String,
    value: String,
    verified: Boolean,
    lastChecked: Date,
    nextCheck: Date
  },
  metadata: {
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }
}, { timestamps: true });

const Domain = mongoose.model('Domain', domainSchema);

async function createDefaultDomain() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener-prod');
    console.log('Connected to MongoDB');

    // Find the first user (admin/owner)
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const firstUser = await User.findOne().sort({ createdAt: 1 });

    if (!firstUser) {
      console.log('No users found. Please create a user first.');
      return;
    }

    console.log('Found user:', firstUser.email);

    // Check if default domain already exists
    const existingDomain = await Domain.findOne({
      fullDomain: 'laghhu.link',
      owner: firstUser._id
    });

    if (existingDomain) {
      console.log('Default domain already exists:', existingDomain.fullDomain);

      // Update it to be default
      existingDomain.isDefault = true;
      existingDomain.status = 'active';
      existingDomain.verificationStatus = 'verified';
      existingDomain.verificationRecord.verified = true;
      await existingDomain.save();

      console.log('✅ Updated existing domain to be default');
      return;
    }

    // Create default domain for laghhu.link
    const defaultDomain = new Domain({
      domain: 'laghhu.link',
      subdomain: null,
      fullDomain: 'laghhu.link',
      owner: firstUser._id,
      organization: firstUser.organization || null,
      status: 'active',
      verificationStatus: 'verified',
      isDefault: true,
      cnameTarget: 'laghhu.link',
      verificationRecord: {
        type: 'A',
        name: 'laghhu.link',
        value: '20.193.155.139',
        verified: true,
        lastChecked: new Date(),
        nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      metadata: {
        addedBy: firstUser._id,
        notes: 'Default domain - automatically created'
      }
    });

    await defaultDomain.save();
    console.log('✅ Created default domain:', defaultDomain.fullDomain);
    console.log('✅ User can now create URLs on laghhu.link domain');

  } catch (error) {
    console.error('Error creating default domain:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createDefaultDomain();