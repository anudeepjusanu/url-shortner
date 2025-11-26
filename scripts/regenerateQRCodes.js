const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Url = require('../src/models/Url');
const QRCodeModel = require('../src/models/QRCode');
require('dotenv').config();

// Helper function to get the correct protocol for a domain
const getProtocolForDomain = (domain) => {
  // If domain already has protocol, don't add one
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return '';
  }

  // For localhost or domains with ports (development), use http://
  if (domain.includes('localhost') || domain.match(/:\d+$/)) {
    return 'http://';
  }

  // For production domains, use https://
  return 'https://';
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Regenerate QR codes for URLs with null or missing QR code data
const regenerateQRCodes = async () => {
  try {
    console.log('🔄 Starting QR Code regeneration...\n');

    // Find all URLs that have qrCodeGenerated: true but qrCode is null or empty
    const urlsNeedingRegeneration = await Url.find({
      $or: [
        { qrCodeGenerated: true, qrCode: null },
        { qrCodeGenerated: true, qrCode: '' },
        { qrCodeGenerated: true, $expr: { $eq: [{ $type: '$qrCode' }, 'null'] } }
      ]
    });

    console.log(`📊 Found ${urlsNeedingRegeneration.length} URLs needing QR code regeneration\n`);

    if (urlsNeedingRegeneration.length === 0) {
      console.log('✅ All QR codes are up to date!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const url of urlsNeedingRegeneration) {
      try {
        console.log(`🔄 Processing: ${url.shortCode}`);

        // Get existing settings or use defaults
        const settings = url.qrCodeSettings || {
          size: 300,
          format: 'png',
          errorCorrection: 'M',
          foregroundColor: '#000000',
          backgroundColor: '#FFFFFF',
          includeMargin: true
        };

        // Build the short URL with QR tracking parameter using the URL's actual domain
        const urlDomain = url.domain || process.env.SHORT_DOMAIN || 'laghhu.link';
        const protocol = getProtocolForDomain(urlDomain);
        const shortUrl = `${protocol}${urlDomain}/${url.shortCode}?qr=1`;

        console.log(`   📱 URL Domain: ${url.domain || 'default'}`);
        console.log(`   📱 Using Domain: ${urlDomain}`);
        console.log(`   📱 Short URL: ${shortUrl}`);
        console.log(`   🎨 Format: ${settings.format}`);

        // Generate QR Code options
        const qrOptions = {
          errorCorrectionLevel: settings.errorCorrection || 'M',
          type: settings.format === 'svg' ? 'svg' : 'image/png',
          quality: 0.92,
          margin: settings.includeMargin ? 4 : 0,
          color: {
            dark: settings.foregroundColor || '#000000',
            light: settings.backgroundColor || '#FFFFFF'
          },
          width: parseInt(settings.size || 300)
        };

        // Generate QR Code
        let qrCodeData;
        if (settings.format === 'svg') {
          qrCodeData = await QRCode.toString(shortUrl, { ...qrOptions, type: 'svg' });
        } else {
          qrCodeData = await QRCode.toDataURL(shortUrl, qrOptions);
        }

        // Update URL with QR code data
        url.qrCode = qrCodeData;
        url.qrCodeGenerated = true;
        url.qrCodeGeneratedAt = url.qrCodeGeneratedAt || new Date();
        url.qrCodeSettings = settings;
        await url.save();

        // Update or create QRCode model document
        let qrCodeDoc = await QRCodeModel.findOne({ url: url._id });
        if (qrCodeDoc) {
          qrCodeDoc.customization = settings;
          qrCodeDoc.updatedAt = new Date();
          await qrCodeDoc.save();
        } else {
          await QRCodeModel.getOrCreate(
            url,
            settings,
            url.creator,
            url.organization
          );
        }

        successCount++;
        console.log(`   ✅ Success! QR code regenerated\n`);

      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error processing ${url.shortCode}:`, error.message, '\n');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Regeneration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total processed: ${urlsNeedingRegeneration.length}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error in regeneration process:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await regenerateQRCodes();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { regenerateQRCodes };
