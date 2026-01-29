#!/usr/bin/env node

/**
 * Auto-Translation Script for i18next Locale Files
 * 
 * This script automatically translates your English locale file to multiple languages
 * using the Google Translate API (via @vitalets/google-translate-api)
 * 
 * Usage:
 *   node scripts/translate-locales.js <target-language-code>
 *   
 * Examples:
 *   node scripts/translate-locales.js fr    # French
 *   node scripts/translate-locales.js es    # Spanish
 *   node scripts/translate-locales.js de    # German
 *   node scripts/translate-locales.js zh-CN # Chinese (Simplified)
 *   node scripts/translate-locales.js ja    # Japanese
 *   node scripts/translate-locales.js ko    # Korean
 *   node scripts/translate-locales.js pt    # Portuguese
 *   node scripts/translate-locales.js ru    # Russian
 *   node scripts/translate-locales.js hi    # Hindi
 *   node scripts/translate-locales.js tr    # Turkish
 * 
 * To translate to multiple languages at once:
 *   node scripts/translate-locales.js fr es de zh-CN ja
 */

const fs = require('fs');
const path = require('path');

// Free translation function using Google Translate (no API key needed)
async function translateText(text, targetLang) {
  try {
    // Using free Google Translate API
    const translate = require('@vitalets/google-translate-api');
    const result = await translate(text, { to: targetLang });
    return result.text;
  } catch (error) {
    console.error(`Translation error for "${text}":`, error.message);
    return text; // Return original text if translation fails
  }
}

// Recursively translate all strings in an object
async function translateObject(obj, targetLang, path = '') {
  const translated = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string') {
      // Skip if it's a placeholder or variable
      if (value.includes('{{') || value.includes('}}')) {
        console.log(`  Skipping placeholder: ${currentPath}`);
        translated[key] = value;
      } else {
        console.log(`  Translating: ${currentPath}`);
        translated[key] = await translateText(value, targetLang);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else if (typeof value === 'object' && value !== null) {
      translated[key] = await translateObject(value, targetLang, currentPath);
    } else {
      translated[key] = value;
    }
  }
  
  return translated;
}

// Language names for display
const languageNames = {
  'fr': 'French',
  'es': 'Spanish',
  'de': 'German',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ja': 'Japanese',
  'ko': 'Korean',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'it': 'Italian',
  'nl': 'Dutch',
  'pl': 'Polish',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'ur': 'Urdu',
  'fa': 'Persian',
  'he': 'Hebrew',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu'
};

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Error: Please specify target language code(s)');
    console.log('\nUsage: node scripts/translate-locales.js <language-code> [language-code2] ...');
    console.log('\nExamples:');
    console.log('  node scripts/translate-locales.js fr');
    console.log('  node scripts/translate-locales.js fr es de');
    console.log('\nSupported languages:', Object.keys(languageNames).join(', '));
    process.exit(1);
  }

  // Check if @vitalets/google-translate-api is installed
  try {
    require('@vitalets/google-translate-api');
  } catch (error) {
    console.log('❌ Error: @vitalets/google-translate-api is not installed');
    console.log('\nPlease install it first:');
    console.log('  npm install --save-dev @vitalets/google-translate-api');
    process.exit(1);
  }

  const sourceFile = path.join(__dirname, '../Url_Shortener-main/src/locales/en.json');
  
  if (!fs.existsSync(sourceFile)) {
    console.log('❌ Error: Source file not found:', sourceFile);
    process.exit(1);
  }

  const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  
  for (const targetLang of args) {
    const langName = languageNames[targetLang] || targetLang;
    console.log(`\n🌍 Translating to ${langName} (${targetLang})...`);
    console.log('━'.repeat(50));
    
    try {
      const translatedData = await translateObject(sourceData, targetLang);
      
      const outputFile = path.join(__dirname, `../Url_Shortener-main/src/locales/${targetLang}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(translatedData, null, 2), 'utf8');
      
      console.log(`\n✅ Successfully created: ${outputFile}`);
      console.log(`   Language: ${langName}`);
    } catch (error) {
      console.error(`\n❌ Failed to translate to ${langName}:`, error.message);
    }
  }
  
  console.log('\n' + '━'.repeat(50));
  console.log('✨ Translation complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Review the generated translation files');
  console.log('2. Update src/i18n.js to include the new languages');
  console.log('3. Add language options to your language selector UI');
}

main().catch(console.error);
