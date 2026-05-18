/**
 * Normalize an email address for consistent storage and matching.
 *
 * Rules:
 * 1. Trim whitespace
 * 2. Lowercase the entire address
 * 3. For Gmail addresses: remove dots from the local part (before @)
 *    e.g. "a.sds@gmail.com" → "asds@gmail.com"
 * 4. All other providers remain unchanged (except trimming + lowercasing)
 *
 * @param {string} email
 * @returns {string}
 */
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';

  let normalized = email.trim().toLowerCase();

  const [localPart, domain] = normalized.split('@');
  if (!domain) return normalized;

  // Gmail-specific: strip dots from local part
  // Also covers googlemail.com
  const gmailDomains = ['gmail.com', 'googlemail.com'];
  if (gmailDomains.includes(domain)) {
    const cleanedLocal = localPart;
    normalized = `${cleanedLocal}@${domain}`;
  }

  return normalized;
};

module.exports = { normalizeEmail };
