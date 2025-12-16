/**
 * Domain utility functions for handling multi-domain support
 * Supports snip.sa and laghu.link (laghhu.link) domains
 */

// Map of known domains and their display names
const DOMAIN_MAP = {
  'snip.sa': 'snip.sa',
  'www.snip.sa': 'snip.sa',
  'laghu.link': 'laghu.link',
  'laghhu.link': 'laghu.link',
  'www.laghu.link': 'laghu.link',
  'www.laghhu.link': 'laghu.link',
  'shortener.laghhu.link': 'laghu.link',
  'localhost': 'localhost:3000',
  'localhost:3000': 'localhost:3000',
  'localhost:3003': 'localhost:3003',
};

// Default domain fallback
const DEFAULT_DOMAIN = 'snip.sa';

/**
 * Get the current base domain based on the hostname
 * @returns {string} The base domain (e.g., 'snip.sa' or 'laghu.link')
 */
export const getCurrentDomain = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_DOMAIN;
  }
  
  const hostname = window.location.hostname.toLowerCase();
  console.log(hostname)
  // Check if hostname matches any known domain
  if (DOMAIN_MAP[hostname]) {
    return DOMAIN_MAP[hostname];
  }
  
  // Check if hostname contains snip.sa
  if (hostname.includes('snip.sa')) {
    return 'snip.sa';
  }
  
  // Check if hostname contains laghu or laghhu
  if (hostname.includes('laghu') || hostname.includes('laghhu')) {
    return 'laghu.link';
  }
  console.log(DEFAULT_DOMAIN)
  // Default fallback
  return DEFAULT_DOMAIN;
};

/**
 * Get the full short URL for a link
 * @param {Object} link - The link object with domain and shortCode
 * @returns {string} The full short URL
 */
export const getShortUrl = (link) => {
  if (!link || !link.shortCode) {
    return '';
  }
  
  const currentDomain = getCurrentDomain();
  
  // If link has a custom domain that's different from the system domains, use it
  if (link.domain && !isSystemDomain(link.domain)) {
    return `${link.domain}/${link.shortCode}`;
  }
  
  // Use the current domain based on where the user is accessing from
  return `${currentDomain}/${link.shortCode}`;
};

/**
 * Get the full short URL with protocol
 * @param {Object} link - The link object with domain and shortCode
 * @returns {string} The full short URL with https://
 */
export const getShortUrlWithProtocol = (link) => {
  if (!link || !link.shortCode) {
    return '';
  }
  
  const currentDomain = getCurrentDomain();
  
  // If link has a custom domain that's different from the system domains
  if (link.domain && !isSystemDomain(link.domain)) {
    // Custom domains might not have SSL, use http
    return `http://${link.domain}/${link.shortCode}`;
  }
  
  // System domains use https
  return `https://${currentDomain}/${link.shortCode}`;
};

/**
 * Check if a domain is a system domain (snip.sa or laghu.link variants)
 * @param {string} domain - The domain to check
 * @returns {boolean} True if it's a system domain
 */
export const isSystemDomain = (domain) => {
  if (!domain) return true;
  
  const normalizedDomain = domain.toLowerCase();
  
  // Check against known system domains
  const systemDomains = [
    'snip.sa',
    'www.snip.sa',
    'laghu.link',
    'laghhu.link',
    'www.laghu.link',
    'www.laghhu.link',
    'shortener.laghhu.link',
    'localhost',
    'localhost:3000',
    'localhost:3003',
    'localhost:3015',
  ];
  
  return systemDomains.includes(normalizedDomain) || 
         normalizedDomain.includes('snip.sa') ||
         normalizedDomain.includes('laghu') ||
         normalizedDomain.includes('laghhu');
};

/**
 * Get display domain for UI (without protocol)
 * @param {Object} link - The link object
 * @returns {string} The domain to display
 */
export const getDisplayDomain = (link) => {
  if (!link) return getCurrentDomain();
  
  // If link has a custom domain that's not a system domain, use it
  if (link.domain && !isSystemDomain(link.domain)) {
    return link.domain;
  }
  
  // Otherwise use the current domain
  return getCurrentDomain();
};

export default {
  getCurrentDomain,
  getShortUrl,
  getShortUrlWithProtocol,
  isSystemDomain,
  getDisplayDomain,
};
