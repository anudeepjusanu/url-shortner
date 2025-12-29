const {
  domainToASCII,
  domainToUnicode,
  hasInternationalChars,
  isPunycode,
  normalizeDomain,
  validateDomain
} = require('../../utils/punycode');

describe('Punycode Utilities', () => {
  describe('domainToASCII', () => {
    test('should convert Arabic domain to Punycode', () => {
      const result = domainToASCII('مثال.com');
      expect(result).toBe('xn--mgbh0fb.com');
    });

    test('should convert Chinese domain to Punycode', () => {
      const result = domainToASCII('例え.jp');
      expect(result).toContain('xn--');
    });

    test('should return ASCII domain unchanged', () => {
      const domain = 'example.com';
      const result = domainToASCII(domain);
      expect(result).toBe('example.com');
    });

    test('should handle subdomains with international characters', () => {
      const result = domainToASCII('مثال.example.com');
      expect(result).toMatch(/^xn--[a-z0-9]+\.example\.com$/);
    });

    test('should handle mixed international and ASCII parts', () => {
      const result = domainToASCII('test.مثال.com');
      expect(result).toMatch(/^test\.xn--[a-z0-9]+\.com$/);
    });

    test('should handle null input', () => {
      expect(domainToASCII(null)).toBeNull();
    });

    test('should handle undefined input', () => {
      expect(domainToASCII(undefined)).toBeUndefined();
    });

    test('should handle non-string input', () => {
      expect(domainToASCII(123)).toBe(123);
      expect(domainToASCII({})).toEqual({});
    });

    test('should trim and lowercase domain', () => {
      const result = domainToASCII('  EXAMPLE.COM  ');
      expect(result).toBe('example.com');
    });

    test('should handle empty string', () => {
      const result = domainToASCII('');
      expect(result).toBe('');
    });

    test('should handle domain with hyphens', () => {
      const result = domainToASCII('my-example.com');
      expect(result).toBe('my-example.com');
    });

    test('should handle domain with numbers', () => {
      const result = domainToASCII('example123.com');
      expect(result).toBe('example123.com');
    });
  });

  describe('domainToUnicode', () => {
    test('should convert Punycode to Arabic domain', () => {
      const result = domainToUnicode('xn--mgbh0fb.com');
      expect(result).toBe('مثال.com');
    });

    test('should return ASCII domain unchanged if no Punycode', () => {
      const domain = 'example.com';
      const result = domainToUnicode(domain);
      expect(result).toBe('example.com');
    });

    test('should handle subdomains with Punycode', () => {
      const result = domainToUnicode('xn--mgbh0fb.example.com');
      expect(result).toContain('مثال');
    });

    test('should handle mixed Punycode and ASCII parts', () => {
      const result = domainToUnicode('test.xn--mgbh0fb.com');
      expect(result).toMatch(/^test\..*\.com$/);
    });

    test('should handle null input', () => {
      expect(domainToUnicode(null)).toBeNull();
    });

    test('should handle undefined input', () => {
      expect(domainToUnicode(undefined)).toBeUndefined();
    });

    test('should handle non-string input', () => {
      expect(domainToUnicode(123)).toBe(123);
    });

    test('should trim and lowercase domain', () => {
      const result = domainToUnicode('  EXAMPLE.COM  ');
      expect(result).toBe('example.com');
    });
  });

  describe('hasInternationalChars', () => {
    test('should return true for Arabic characters', () => {
      expect(hasInternationalChars('مثال.com')).toBe(true);
    });

    test('should return true for Chinese characters', () => {
      expect(hasInternationalChars('例え.jp')).toBe(true);
    });

    test('should return true for Cyrillic characters', () => {
      expect(hasInternationalChars('пример.ru')).toBe(true);
    });

    test('should return false for ASCII domain', () => {
      expect(hasInternationalChars('example.com')).toBe(false);
    });

    test('should return false for domain with numbers and hyphens', () => {
      expect(hasInternationalChars('my-example-123.com')).toBe(false);
    });

    test('should return false for null input', () => {
      expect(hasInternationalChars(null)).toBe(false);
    });

    test('should return false for undefined input', () => {
      expect(hasInternationalChars(undefined)).toBe(false);
    });

    test('should return false for non-string input', () => {
      expect(hasInternationalChars(123)).toBe(false);
    });
  });

  describe('isPunycode', () => {
    test('should return true for Punycode domain', () => {
      expect(isPunycode('xn--mgbh0fb.com')).toBe(true);
    });

    test('should return true for subdomain with Punycode', () => {
      expect(isPunycode('test.xn--mgbh0fb.com')).toBe(true);
    });

    test('should return false for ASCII domain', () => {
      expect(isPunycode('example.com')).toBe(false);
    });

    test('should return false for international characters (not Punycode)', () => {
      expect(isPunycode('مثال.com')).toBe(false);
    });

    test('should be case-insensitive', () => {
      expect(isPunycode('XN--MGBH0FB.COM')).toBe(true);
    });

    test('should return false for null input', () => {
      expect(isPunycode(null)).toBe(false);
    });

    test('should return false for undefined input', () => {
      expect(isPunycode(undefined)).toBe(false);
    });
  });

  describe('normalizeDomain', () => {
    test('should convert international domain to Punycode', () => {
      const result = normalizeDomain('مثال.com');
      expect(result).toMatch(/^xn--[a-z0-9]+\.com$/);
    });

    test('should lowercase and trim ASCII domain', () => {
      const result = normalizeDomain('  EXAMPLE.COM  ');
      expect(result).toBe('example.com');
    });

    test('should handle already normalized domain', () => {
      const result = normalizeDomain('example.com');
      expect(result).toBe('example.com');
    });

    test('should handle mixed case international domain', () => {
      const result = normalizeDomain('  مثال.COM  ');
      expect(result).toMatch(/^xn--[a-z0-9]+\.com$/);
    });

    test('should handle null input', () => {
      expect(normalizeDomain(null)).toBeNull();
    });

    test('should handle undefined input', () => {
      expect(normalizeDomain(undefined)).toBeUndefined();
    });
  });

  describe('validateDomain', () => {
    test('should validate ASCII domain', () => {
      const result = validateDomain('example.com');
      expect(result.isValid).toBe(true);
      expect(result.normalizedDomain).toBe('example.com');
    });

    test('should validate international domain', () => {
      const result = validateDomain('مثال.com');
      expect(result.isValid).toBe(true);
      expect(result.normalizedDomain).toMatch(/^xn--[a-z0-9]+\.com$/);
      expect(result.unicodeDomain).toContain('مثال');
    });

    test('should validate subdomain', () => {
      const result = validateDomain('sub.example.com');
      expect(result.isValid).toBe(true);
    });

    test('should validate domain with hyphens', () => {
      const result = validateDomain('my-example.com');
      expect(result.isValid).toBe(true);
    });

    test('should validate domain with numbers', () => {
      const result = validateDomain('example123.com');
      expect(result.isValid).toBe(true);
    });

    test('should reject empty domain', () => {
      const result = validateDomain('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });

    test('should reject null domain', () => {
      const result = validateDomain(null);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });

    test('should reject domain without TLD', () => {
      const result = validateDomain('example');
      expect(result.isValid).toBe(false);
    });

    test('should reject domain with invalid characters', () => {
      const result = validateDomain('exam ple.com');
      expect(result.isValid).toBe(false);
    });

    test('should reject domain that is too long', () => {
      const longDomain = 'a'.repeat(250) + '.com';
      const result = validateDomain(longDomain);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too long');
    });

    test('should reject domain with label too long', () => {
      const longLabel = 'a'.repeat(64) + '.com';
      const result = validateDomain(longLabel);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('label');
    });

    test('should reject domain starting with hyphen', () => {
      const result = validateDomain('-example.com');
      expect(result.isValid).toBe(false);
    });

    test('should reject domain ending with hyphen', () => {
      const result = validateDomain('example-.com');
      expect(result.isValid).toBe(false);
    });

    test('should reject domain with consecutive dots', () => {
      const result = validateDomain('example..com');
      expect(result.isValid).toBe(false);
    });

    test('should validate .sa domain', () => {
      const result = validateDomain('example.sa');
      expect(result.isValid).toBe(true);
    });

    test('should validate international .sa domain', () => {
      const result = validateDomain('مثال.sa');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle domain with special Unicode characters', () => {
      const result = domainToASCII('тест.рф');
      expect(result).toContain('xn--');
    });

    test('should handle very long international domain label', () => {
      const longLabel = 'مثال'.repeat(20);
      const result = validateDomain(`${longLabel}.com`);
      // Should either convert or reject based on length
      expect(typeof result.isValid).toBe('boolean');
    });

    test('should handle domain with emoji (should fail validation)', () => {
      const result = validateDomain('test😀.com');
      // Emojis are not valid in domain names
      expect(result.isValid).toBe(false);
    });

    test('should handle multiple subdomains with international characters', () => {
      const result = domainToASCII('مثال.sub.example.com');
      expect(result).toMatch(/^xn--[a-z0-9]+\.sub\.example\.com$/);
    });

    test('should be idempotent for ASCII domains', () => {
      const domain = 'example.com';
      const result1 = domainToASCII(domain);
      const result2 = domainToASCII(result1);
      expect(result1).toBe(result2);
    });

    test('should handle roundtrip conversion', () => {
      const original = 'مثال.com';
      const ascii = domainToASCII(original);
      const unicode = domainToUnicode(ascii);
      expect(unicode).toBe(original);
    });
  });
});