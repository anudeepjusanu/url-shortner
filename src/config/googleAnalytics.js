/**
 * Google Analytics Configuration
 * 
 * Required environment variables:
 * - GA_PROPERTY_ID: Your GA4 property ID (numeric, e.g., 123456789)
 * - GA_CLIENT_EMAIL: Service account email
 * - GA_PRIVATE_KEY: Service account private key (with \n for newlines)
 * 
 * OR
 * - GA_CREDENTIALS_PATH: Path to the JSON credentials file
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');

let analyticsDataClient = null;

/**
 * Initialize the Google Analytics Data API client
 */
const initializeClient = () => {
  if (analyticsDataClient) {
    return analyticsDataClient;
  }

  const propertyId = process.env.GA_PROPERTY_ID;
  
  if (!propertyId) {
    console.warn('⚠️ GA_PROPERTY_ID not configured. Google Analytics integration disabled.');
    return null;
  }

  try {
    // Option 1: Use credentials file path
    if (process.env.GA_CREDENTIALS_PATH) {
      analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: process.env.GA_CREDENTIALS_PATH
      });
      console.log('✅ Google Analytics client initialized with credentials file');
    }
    // Option 2: Use inline credentials
    else if (process.env.GA_CLIENT_EMAIL && process.env.GA_PRIVATE_KEY) {
      analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: process.env.GA_CLIENT_EMAIL,
          private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n')
        }
      });
      console.log('✅ Google Analytics client initialized with inline credentials');
    }
    else {
      console.warn('⚠️ Google Analytics credentials not configured. Integration disabled.');
      return null;
    }

    return analyticsDataClient;
  } catch (error) {
    console.error('❌ Failed to initialize Google Analytics client:', error.message);
    return null;
  }
};

/**
 * Get the GA4 property ID in the required format
 */
const getPropertyId = () => {
  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) return null;
  
  // If already in format "properties/123456789", return as is
  if (propertyId.startsWith('properties/')) {
    return propertyId;
  }
  
  // Otherwise, add the prefix
  return `properties/${propertyId}`;
};

/**
 * Check if Google Analytics is configured
 */
const isConfigured = () => {
  return !!(process.env.GA_PROPERTY_ID && 
    (process.env.GA_CREDENTIALS_PATH || 
     (process.env.GA_CLIENT_EMAIL && process.env.GA_PRIVATE_KEY)));
};

module.exports = {
  initializeClient,
  getPropertyId,
  isConfigured,
  getClient: () => analyticsDataClient || initializeClient()
};
