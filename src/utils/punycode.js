const punycode = require('punycode/');

/**
 * Converts international domain names to ASCII-compatible encoding (Punycode)
 * Example: "مثال.com" → "xn--mgbal82c.com"
 *
 * @param {string} domain - The domain name (can contain Unicode characters)
 * @returns {string} - ASCII-compatible domain name
 */
const domainToASCII = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return domain;
  }

  try {
    // Trim and lowercase the domain
    domain = domain.trim().toLowerCase();

    // Check if domain is already ASCII (no international characters)
    if (/^[a-z0-9.-]+$/i.test(domain)) {
      return domain;
    }

    // Split domain into parts (handle subdomains)
    const parts = domain.split('.');

    // Convert each part to Punycode if needed
    const asciiParts = parts.map(part => {
      // If part contains non-ASCII characters, convert to Punycode
      if (!/^[a-z0-9-]+$/i.test(part)) {
        return punycode.toASCII(part);
      }
      return part;
    });

    return asciiParts.join('.');
  } catch (error) {
    console.error('Error converting domain to ASCII:', error);
    return domain; // Return original if conversion fails
  }
};

/**
 * Converts ASCII-compatible domain names (Punycode) to Unicode
 * Example: "xn--mgbal82c.com" → "مثال.com"
 *
 * @param {string} domain - The ASCII-compatible domain name
 * @returns {string} - Unicode domain name
 */
const domainToUnicode = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return domain;
  }

  try {
    // Trim and lowercase the domain
    domain = domain.trim().toLowerCase();

    // Check if domain contains Punycode (xn--)
    if (!domain.includes('xn--')) {
      return domain;
    }

    // Split domain into parts
    const parts = domain.split('.');

    // Convert each Punycode part to Unicode
    const unicodeParts = parts.map(part => {
      if (part.startsWith('xn--')) {
        return punycode.toUnicode(part);
      }
      return part;
    });

    return unicodeParts.join('.');
  } catch (error) {
    console.error('Error converting domain to Unicode:', error);
    return domain; // Return original if conversion fails
  }
};

/**
 * Checks if a domain contains international (non-ASCII) characters
 *
 * @param {string} domain - The domain name to check
 * @returns {boolean} - true if domain contains international characters
 */
const hasInternationalChars = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  // Check if domain contains any character outside ASCII range
  return !/^[a-z0-9.-]+$/i.test(domain);
};

/**
 * Checks if a domain is in Punycode format (contains xn--)
 *
 * @param {string} domain - The domain name to check
 * @returns {boolean} - true if domain is in Punycode format
 */
const isPunycode = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  return domain.toLowerCase().includes('xn--');
};

/**
 * Normalizes a domain name (converts to ASCII if needed)
 * This ensures consistent storage and comparison
 *
 * @param {string} domain - The domain name
 * @returns {string} - Normalized domain name
 */
const normalizeDomain = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return domain;
  }

  // Convert to lowercase and trim
  domain = domain.trim().toLowerCase();

  // Convert to ASCII (Punycode) if it contains international characters
  if (hasInternationalChars(domain)) {
    return domainToASCII(domain);
  }

  return domain;
};

/**
 * Validates a domain name (supports both ASCII and international domains)
 *
 * @param {string} domain - The domain name to validate
 * @returns {object} - {isValid: boolean, message: string, normalizedDomain: string}
 */
const validateDomain = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return {
      isValid: false,
      message: 'Domain name is required'
    };
  }

  // Trim and lowercase
  domain = domain.trim().toLowerCase();

  // Check length
  if (domain.length > 253) {
    return {
      isValid: false,
      message: 'Domain name is too long (max 253 characters)'
    };
  }

  // Convert to ASCII for validation
  let asciiDomain;
  try {
    asciiDomain = domainToASCII(domain);
  } catch (error) {
    return {
      isValid: false,
      message: 'Invalid domain name format'
    };
  }

  // Validate ASCII domain format
  // This regex accepts:
  // - Standard ASCII domains (example.com)
  // - Punycode domains (xn--mgbal82c.com)
  // - Subdomains (sub.example.com)
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  if (!domainRegex.test(asciiDomain)) {
    return {
      isValid: false,
      message: 'Invalid domain name format'
    };
  }

  // Check each label (part between dots)
  const labels = asciiDomain.split('.');
  for (const label of labels) {
    if (label.length > 63) {
      return {
        isValid: false,
        message: 'Domain label is too long (max 63 characters per part)'
      };
    }
  }

  return {
    isValid: true,
    message: 'Valid domain',
    normalizedDomain: asciiDomain,
    unicodeDomain: domainToUnicode(asciiDomain)
  };
};

module.exports = {
  domainToASCII,
  domainToUnicode,
  hasInternationalChars,
  isPunycode,
  normalizeDomain,
  validateDomain
};
