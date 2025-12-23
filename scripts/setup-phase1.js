#!/usr/bin/env node

/**
 * Phase 1 Features Setup Script
 * 
 * This script helps set up Phase 1 features:
 * - Bio Link Pages
 * - Link Bundles
 * - Enhanced Social Previews
 * - Link Health Monitoring
 */

const mongoose = require('mongoose');
require('dotenv').config();

const setupPhase1 = async () => {
  try {
    console.log('🚀 Setting up Phase 1 features...\n');

    // Connect to database
    console.log('📦 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener');
    console.log('✓ Connected to database\n');

    // Import models to ensure indexes are created
    console.log('📋 Creating database indexes...');
    require('../src/models/BioPage');
    require('../src/models/LinkBundle');
    require('../src/models/LinkHealth');
    require('../src/models/Url');
    
    // Wait for indexes to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✓ Database indexes created\n');

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📊 Database collections:');
    console.log('  - biopages:', collectionNames.includes('biopages') ? '✓' : '✗ (will be created on first use)');
    console.log('  - linkbundles:', collectionNames.includes('linkbundles') ? '✓' : '✗ (will be created on first use)');
    console.log('  - linkhealths:', collectionNames.includes('linkhealths') ? '✓' : '✗ (will be created on first use)');
    console.log('  - urls:', collectionNames.includes('urls') ? '✓' : '✗');
    console.log('');

    // Display feature summary
    console.log('🎉 Phase 1 Features Ready!\n');
    console.log('Available Features:');
    console.log('  1. Bio Link Pages (Linktree alternative)');
    console.log('     - API: /api/bio-pages');
    console.log('     - Public: /api/bio-pages/public/:slug');
    console.log('');
    console.log('  2. Link Bundles/Collections');
    console.log('     - API: /api/bundles');
    console.log('     - Public: /api/bundles/public/:slug');
    console.log('');
    console.log('  3. Enhanced Social Media Previews');
    console.log('     - Included in URL model (socialPreview field)');
    console.log('');
    console.log('  4. Link Health Monitoring');
    console.log('     - API: /api/health');
    console.log('     - Cron: Runs every 15 minutes');
    console.log('');

    // Display next steps
    console.log('📝 Next Steps:');
    console.log('  1. Restart your server to load new routes');
    console.log('  2. Check PHASE1_FEATURES.md for API documentation');
    console.log('  3. Test endpoints with the provided curl commands');
    console.log('  4. Build frontend components for new features');
    console.log('');

    // Display example API calls
    console.log('🧪 Example API Calls:');
    console.log('');
    console.log('  Create Bio Page:');
    console.log('  curl -X POST http://localhost:4000/api/bio-pages \\');
    console.log('    -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"slug":"username","title":"My Name","bio":"Welcome!"}\'');
    console.log('');
    console.log('  Create Link Bundle:');
    console.log('  curl -X POST http://localhost:4000/api/bundles \\');
    console.log('    -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"name":"My Bundle","slug":"my-bundle"}\'');
    console.log('');
    console.log('  Enable Health Monitoring:');
    console.log('  curl -X POST http://localhost:4000/api/health/URL_ID/enable \\');
    console.log('    -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"checkInterval":60,"notifyOnFailure":true}\'');
    console.log('');

    console.log('✅ Setup complete!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run setup
setupPhase1();
