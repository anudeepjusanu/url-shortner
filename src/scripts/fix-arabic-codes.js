/**
 * Migration Script: Fix Arabic and International Character Short Codes
 * 
 * This script identifies and reports URLs with international characters
 * that may have been corrupted by the previous lowercase transformation.
 * 
 * Usage:
 *   node src/scripts/fix-arabic-codes.js
 */

const mongoose = require('mongoose');
const Url = require('../models/Url');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check if string contains international (non-ASCII) characters
const hasInternationalChars = (str) => {
  return /[^\x00-\x7F]/.test(str);
};

// Check if string contains Arabic characters
const hasArabicChars = (str) => {
  return /[\u0600-\u06FF]/.test(str);
};

// Check if string contains Chinese characters
const hasChineseChars = (str) => {
  return /[\u4E00-\u9FFF]/.test(str);
};

// Check if string contains Cyrillic characters
const hasCyrillicChars = (str) => {
  return /[\u0400-\u04FF]/.test(str);
};

const analyzeShortCodes = async () => {
  try {
    console.log('\n🔍 Analyzing short codes in database...\n');

    const urls = await Url.find({}).select('shortCode customCode originalUrl createdAt clickCount');
    
    const stats = {
      total: urls.length,
      withInternationalChars: 0,
      withArabic: 0,
      withChinese: 0,
      withCyrillic: 0,
      withOther: 0,
      asciiOnly: 0
    };

    const internationalUrls = [];

    for (const url of urls) {
      const code = url.customCode || url.shortCode;
      
      if (hasInternationalChars(code)) {
        stats.withInternationalChars++;
        
        const charType = [];
        if (hasArabicChars(code)) {
          stats.withArabic++;
          charType.push('Arabic');
        }
        if (hasChineseChars(code)) {
          stats.withChinese++;
          charType.push('Chinese');
        }
        if (hasCyrillicChars(code)) {
          stats.withCyrillic++;
          charType.push('Cyrillic');
        }
        if (charType.length === 0) {
          stats.withOther++;
          charType.push('Other');
        }

        internationalUrls.push({
          id: url._id,
          shortCode: url.shortCode,
          customCode: url.customCode,
          code: code,
          charType: charType.join(', '),
          originalUrl: url.originalUrl,
          clickCount: url.clickCount,
          createdAt: url.createdAt,
          bytes: Buffer.from(code).toString('hex')
        });
      } else {
        stats.asciiOnly++;
      }
    }

    // Print statistics
    console.log('📊 Statistics:');
    console.log('─'.repeat(50));
    console.log(`Total URLs: ${stats.total}`);
    console.log(`ASCII-only codes: ${stats.asciiOnly}`);
    console.log(`International character codes: ${stats.withInternationalChars}`);
    console.log(`  - Arabic: ${stats.withArabic}`);
    console.log(`  - Chinese: ${stats.withChinese}`);
    console.log(`  - Cyrillic: ${stats.withCyrillic}`);
    console.log(`  - Other: ${stats.withOther}`);
    console.log('─'.repeat(50));

    // Print details of international URLs
    if (internationalUrls.length > 0) {
      console.log('\n📝 URLs with International Characters:');
      console.log('─'.repeat(50));
      
      internationalUrls.forEach((url, index) => {
        console.log(`\n${index + 1}. ${url.charType} Code:`);
        console.log(`   Code: ${url.code}`);
        console.log(`   Hex: ${url.bytes}`);
        console.log(`   Original URL: ${url.originalUrl.substring(0, 60)}${url.originalUrl.length > 60 ? '...' : ''}`);
        console.log(`   Clicks: ${url.clickCount}`);
        console.log(`   Created: ${url.createdAt.toISOString().split('T')[0]}`);
        console.log(`   ID: ${url.id}`);
      });
      
      console.log('\n─'.repeat(50));
      console.log('\n✅ Analysis complete!');
      console.log('\n💡 These URLs should now work correctly with the updated code.');
      console.log('   Test by accessing: http://localhost:3015/' + internationalUrls[0].code);
    } else {
      console.log('\n✅ No URLs with international characters found.');
      console.log('   All short codes use ASCII characters only.');
    }

  } catch (error) {
    console.error('❌ Error analyzing short codes:', error);
    throw error;
  }
};

const testRedirect = async (shortCode) => {
  try {
    console.log(`\n🧪 Testing redirect for: ${shortCode}`);
    console.log('─'.repeat(50));

    const url = await Url.findOne({
      $or: [{ shortCode }, { customCode: shortCode }]
    });

    if (url) {
      console.log('✅ URL found in database!');
      console.log(`   Short Code: ${url.shortCode}`);
      console.log(`   Custom Code: ${url.customCode || 'N/A'}`);
      console.log(`   Original URL: ${url.originalUrl}`);
      console.log(`   Active: ${url.isActive}`);
      console.log(`   Clicks: ${url.clickCount}`);
    } else {
      console.log('❌ URL not found in database');
      console.log('   This may indicate an encoding issue.');
    }

  } catch (error) {
    console.error('❌ Error testing redirect:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    console.log('\n' + '='.repeat(50));
    console.log('  Arabic & International Character Code Analyzer');
    console.log('='.repeat(50));

    await analyzeShortCodes();

    // If you want to test a specific short code, uncomment and modify:
    // await testRedirect('مثال');

    console.log('\n✅ Script completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { analyzeShortCodes, testRedirect };