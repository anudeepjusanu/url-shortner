const crypto = require('crypto');
const config = require('../config/environment');

class ShortCodeGenerator {
  constructor() {
    this.chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.shortChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    this.defaultLength = config.DEFAULT_SHORT_CODE_LENGTH || 6;
  }
  
  generateShortCode(length = this.defaultLength, options = {}) {
    const {
      includeUppercase = true,
      excludeSimilar = false,
      customCharset,
      prefix = '',
      suffix = ''
    } = options;
    
    let charset = customCharset || (includeUppercase ? this.chars : this.shortChars);
    
    if (excludeSimilar) {
      charset = charset.replace(/[0O1Il]/g, '');
    }
    
    if (length < config.MIN_SHORT_CODE_LENGTH || length > config.MAX_SHORT_CODE_LENGTH) {
      length = this.defaultLength;
    }
    
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += charset[randomBytes[i] % charset.length];
    }
    
    return prefix + result + suffix;
  }
  
  generateSequentialCode(sequence) {
    const base62 = this.chars;
    let result = '';
    let num = sequence;
    
    if (num === 0) return base62[0];
    
    while (num > 0) {
      result = base62[num % 62] + result;
      num = Math.floor(num / 62);
    }
    
    const minLength = config.MIN_SHORT_CODE_LENGTH || 4;
    return result.padStart(minLength, base62[0]);
  }
  
  generateReadableCode(length = 6) {
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const charset = i % 2 === 0 ? consonants : vowels;
      const randomIndex = crypto.randomInt(charset.length);
      result += charset[randomIndex];
    }
    
    return result;
  }
  
  generateWordBasedCode() {
    const adjectives = [
      'quick', 'bright', 'calm', 'brave', 'clever', 'eager',
      'fair', 'gentle', 'happy', 'kind', 'lively', 'nice',
      'proud', 'swift', 'wise', 'young', 'bold', 'cool'
    ];
    
    const nouns = [
      'cat', 'dog', 'bird', 'fish', 'tree', 'rock',
      'star', 'moon', 'sun', 'wave', 'wind', 'fire',
      'cloud', 'rain', 'snow', 'leaf', 'bear', 'fox'
    ];
    
    const adjective = adjectives[crypto.randomInt(adjectives.length)];
    const noun = nouns[crypto.randomInt(nouns.length)];
    const number = crypto.randomInt(100, 999);
    
    return `${adjective}${noun}${number}`;
  }
  
  generateCustomCode(pattern) {
    let result = '';
    
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      
      switch (char) {
        case '#':
          result += this.chars[crypto.randomInt(this.chars.length)];
          break;
        case '9':
          result += String(crypto.randomInt(10));
          break;
        case 'A':
          result += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[crypto.randomInt(26)];
          break;
        case 'a':
          result += 'abcdefghijklmnopqrstuvwxyz'[crypto.randomInt(26)];
          break;
        default:
          result += char;
          break;
      }
    }
    
    return result;
  }
  
  generateTimestampCode(includeDate = false) {
    const now = new Date();
    const timestamp = includeDate ? 
      now.getTime().toString(36) : 
      (now.getTime() % (24 * 60 * 60 * 1000)).toString(36);
    
    const randomSuffix = crypto.randomBytes(2).toString('hex');
    
    return timestamp + randomSuffix;
  }
  
  generateSecureCode(length = 8) {
    const secureChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    const randomBytes = crypto.randomBytes(length);
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += secureChars[randomBytes[i] % secureChars.length];
    }
    
    return result;
  }
  
  validateShortCode(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, reason: 'Code must be a non-empty string' };
    }
    
    if (code.length < config.MIN_SHORT_CODE_LENGTH) {
      return { 
        valid: false, 
        reason: `Code must be at least ${config.MIN_SHORT_CODE_LENGTH} characters long` 
      };
    }
    
    if (code.length > config.MAX_SHORT_CODE_LENGTH) {
      return { 
        valid: false, 
        reason: `Code cannot exceed ${config.MAX_SHORT_CODE_LENGTH} characters` 
      };
    }
    
    if (!/^[\p{L}\p{N}_-]+$/u.test(code)) {
      return { 
        valid: false, 
        reason: 'Code can only contain letters (any language), numbers, hyphens, and underscores' 
      };
    }
    
    const reservedWords = [
      'api', 'admin', 'www', 'app', 'dashboard', 'login',
      'register', 'auth', 'profile', 'settings', 'help',
      'about', 'contact', 'terms',  'support',
      'analytics', 'stats', 'health', 'ping', 'test'
    ];
    
    if (reservedWords.includes(code.toLowerCase())) {
      return { valid: false, reason: 'Code conflicts with reserved words' };
    }
    
    return { valid: true };
  }
  
  generateBatch(count, length = this.defaultLength, options = {}) {
    const codes = new Set();
    const maxAttempts = count * 10;
    let attempts = 0;
    
    while (codes.size < count && attempts < maxAttempts) {
      const code = this.generateShortCode(length, options);
      codes.add(code);
      attempts++;
    }
    
    return Array.from(codes);
  }
  
  estimateCollisionProbability(length, existingCount) {
    const charset = this.chars;
    const totalPossible = Math.pow(charset.length, length);
    
    const probability = 1 - Math.exp(-Math.pow(existingCount, 2) / (2 * totalPossible));
    
    return {
      probability: probability * 100,
      totalPossible,
      existingCount,
      recommendation: probability > 0.01 ? 'Consider increasing length' : 'Length is sufficient'
    };
  }
  
  suggestLength(targetUrls) {
    const charset = this.chars;
    let length = config.MIN_SHORT_CODE_LENGTH;
    
    while (length <= config.MAX_SHORT_CODE_LENGTH) {
      const totalPossible = Math.pow(charset.length, length);
      const collisionProb = 1 - Math.exp(-Math.pow(targetUrls, 2) / (2 * totalPossible));
      
      if (collisionProb < 0.01) {
        return {
          suggestedLength: length,
          totalPossible,
          collisionProbability: collisionProb * 100
        };
      }
      
      length++;
    }
    
    return {
      suggestedLength: config.MAX_SHORT_CODE_LENGTH,
      totalPossible: Math.pow(charset.length, config.MAX_SHORT_CODE_LENGTH),
      collisionProbability: 'High - consider alternative strategy'
    };
  }
}

const generator = new ShortCodeGenerator();

module.exports = {
  generateShortCode: generator.generateShortCode.bind(generator),
  generateSequentialCode: generator.generateSequentialCode.bind(generator),
  generateReadableCode: generator.generateReadableCode.bind(generator),
  generateWordBasedCode: generator.generateWordBasedCode.bind(generator),
  generateCustomCode: generator.generateCustomCode.bind(generator),
  generateTimestampCode: generator.generateTimestampCode.bind(generator),
  generateSecureCode: generator.generateSecureCode.bind(generator),
  validateShortCode: generator.validateShortCode.bind(generator),
  generateBatch: generator.generateBatch.bind(generator),
  estimateCollisionProbability: generator.estimateCollisionProbability.bind(generator),
  suggestLength: generator.suggestLength.bind(generator)
};