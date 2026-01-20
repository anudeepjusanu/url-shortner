const dns = require('dns').promises;
const Domain = require('../models/Domain');

class DomainService {
  constructor() {
    this.cnameTarget = process.env.CNAME_TARGET || 'laghhu.link';
    this.verificationTimeout = 10000; // 10 seconds timeout for DNS queries
  }

  async verifyDNSRecord(domain, recordType = 'CNAME', expectedValue = null) {
    try {
      const options = { timeout: this.verificationTimeout };
      const fullDomain = domain.toLowerCase().trim();
      const targetValue = expectedValue || this.cnameTarget;

      switch (recordType.toUpperCase()) {
        case 'CNAME':
          return await this.verifyCNAME(fullDomain, targetValue, options);
        case 'A':
          return await this.verifyARecord(fullDomain, targetValue, options);
        case 'TXT':
          return await this.verifyTXTRecord(fullDomain, targetValue, options);
        default:
          throw new Error(`Unsupported DNS record type: ${recordType}`);
      }
    } catch (error) {
      return {
        verified: false,
        error: error.message,
        details: null
      };
    }
  }

  async verifyCNAME(domain, targetValue, options = {}) {
    try {
      const records = await dns.resolveCname(domain);
      
      // Normalize target value by removing trailing dots and converting to lowercase
      const normalizedTarget = targetValue.toLowerCase().replace(/\.$/, '');
      
      // Check if any record matches the target
      const verified = records.some(record => {
        // Normalize record by removing trailing dots and converting to lowercase
        const normalizedRecord = record.toLowerCase().replace(/\.$/, '');
        
        // Check for exact match
        if (normalizedRecord === normalizedTarget) {
          return true;
        }
        
        // Check if record ends with target (handles subdomains)
        // e.g., "www.laghhu.link" should match "laghhu.link"
        if (normalizedRecord.endsWith(`.${normalizedTarget}`)) {
          return true;
        }
        
        // Check if target ends with record (reverse case)
        if (normalizedTarget.endsWith(`.${normalizedRecord}`)) {
          return true;
        }
        
        // Check if either contains the other (original logic, kept for compatibility)
        if (normalizedRecord.includes(normalizedTarget) || 
            normalizedTarget.includes(normalizedRecord)) {
          return true;
        }
        
        return false;
      });

      return {
        verified,
        records,
        expected: targetValue,
        recordType: 'CNAME'
      };
    } catch (error) {
      if (error.code === 'ENODATA') {
        return {
          verified: false,
          error: 'No CNAME record found',
          records: [],
          expected: targetValue,
          recordType: 'CNAME'
        };
      }
      throw error;
    }
  }

  async verifyARecord(domain, targetValue, options = {}) {
    try {
      const records = await dns.resolve4(domain);
      const verified = records.includes(targetValue);

      return {
        verified,
        records,
        expected: targetValue,
        recordType: 'A'
      };
    } catch (error) {
      if (error.code === 'ENODATA') {
        return {
          verified: false,
          error: 'No A record found',
          records: [],
          expected: targetValue,
          recordType: 'A'
        };
      }
      throw error;
    }
  }

  async verifyTXTRecord(domain, targetValue, options = {}) {
    try {
      const records = await dns.resolveTxt(domain);
      const flatRecords = records.flat();
      const verified = flatRecords.some(record => record.includes(targetValue));

      return {
        verified,
        records: flatRecords,
        expected: targetValue,
        recordType: 'TXT'
      };
    } catch (error) {
      if (error.code === 'ENODATA') {
        return {
          verified: false,
          error: 'No TXT record found',
          records: [],
          expected: targetValue,
          recordType: 'TXT'
        };
      }
      throw error;
    }
  }

  async checkDomainVerification(domainId) {
    try {
      const domain = await Domain.findById(domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }

      console.log('🔍 Verifying domain:', {
        domainId,
        fullDomain: domain.fullDomain,
        expectedTarget: domain.verificationRecord.value,
        recordType: domain.verificationRecord.type
      });

      const verification = await this.verifyDNSRecord(
        domain.fullDomain,
        domain.verificationRecord.type,
        domain.verificationRecord.value
      );

      console.log('📋 DNS Verification result:', {
        verified: verification.verified,
        records: verification.records,
        expected: verification.expected,
        error: verification.error
      });

      domain.verificationRecord.lastChecked = new Date();

      if (verification.verified) {
        await domain.markAsVerified();
        console.log('✅ Domain verified successfully:', domain.fullDomain);
        return {
          success: true,
          verified: true,
          domain: domain.fullDomain,
          message: 'Domain verification successful'
        };
      } else {
        await domain.markVerificationFailed(verification.error || 'DNS verification failed');
        console.log('❌ Domain verification failed:', {
          domain: domain.fullDomain,
          error: verification.error,
          records: verification.records,
          expected: verification.expected
        });
        return {
          success: false,
          verified: false,
          domain: domain.fullDomain,
          error: verification.error || 'DNS verification failed',
          details: verification
        };
      }
    } catch (error) {
      console.error('❌ Domain verification error:', error);
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }

  async bulkVerifyDomains() {
    try {
      const pendingDomains = await Domain.find({
        verificationStatus: { $in: ['pending', 'failed'] },
        $or: [
          { 'verificationRecord.nextCheck': { $lte: new Date() } },
          { 'verificationRecord.nextCheck': { $exists: false } }
        ]
      });

      const results = [];

      for (const domain of pendingDomains) {
        const result = await this.checkDomainVerification(domain._id);
        results.push({
          domainId: domain._id,
          domain: domain.fullDomain,
          ...result
        });

        // Rate limiting to avoid overwhelming DNS servers
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        totalChecked: results.length,
        verified: results.filter(r => r.verified).length,
        failed: results.filter(r => !r.verified).length,
        results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateCNAMERecord(domain, subdomain = null) {
    const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

    return {
      type: 'CNAME',
      name: fullDomain,
      value: this.cnameTarget,
      description: `Point ${fullDomain} to ${this.cnameTarget}`,
      instructions: {
        type: 'CNAME',
        host: subdomain || '@',
        value: this.cnameTarget,
        ttl: 300
      }
    };
  }

  async getDomainInfo(domain) {
    try {
      const results = await Promise.allSettled([
        dns.resolveCname(domain).catch(() => []),
        dns.resolve4(domain).catch(() => []),
        dns.resolveTxt(domain).catch(() => []),
        dns.resolveMx(domain).catch(() => [])
      ]);

      return {
        domain,
        cname: results[0].status === 'fulfilled' ? results[0].value : [],
        a: results[1].status === 'fulfilled' ? results[1].value : [],
        txt: results[2].status === 'fulfilled' ? results[2].value.flat() : [],
        mx: results[3].status === 'fulfilled' ? results[3].value : [],
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        domain,
        error: error.message,
        lastChecked: new Date()
      };
    }
  }

  async detectDNSProvider(domain) {
    try {
      const nsRecords = await dns.resolveNs(domain);
      const providers = [];

      // Common DNS provider patterns
      const providerPatterns = {
        'cloudflare': /cloudflare/i,
        'namecheap': /namecheap/i,
        'godaddy': /godaddy/i,
        'amazon': /amazon|aws/i,
        'google': /google/i,
        'digitalocean': /digitalocean/i
      };

      for (const ns of nsRecords) {
        for (const [provider, pattern] of Object.entries(providerPatterns)) {
          if (pattern.test(ns)) {
            providers.push({
              name: provider,
              nameserver: ns,
              detected: true
            });
          }
        }
      }

      if (providers.length === 0) {
        providers.push({
          name: 'unknown',
          nameserver: nsRecords[0] || 'unknown',
          detected: false
        });
      }

      return providers;
    } catch (error) {
      return [{
        name: 'unknown',
        error: error.message,
        detected: false
      }];
    }
  }

  getSetupInstructions(domain, recordType = 'CNAME') {
    const instructions = {
      CNAME: {
        title: 'Add CNAME Record',
        steps: [
          'Log into your domain registrar or DNS provider',
          `Find the DNS settings for ${domain}`,
          'Add a new CNAME record with these values:',
          `  - Type: CNAME`,
          `  - Name: ${domain}`,
          `  - Value: ${this.cnameTarget}`,
          `  - TTL: 300 (or leave default)`,
          'Save the changes',
          'Wait for DNS propagation (up to 24 hours)',
          'Click "Verify DNS" to check the configuration'
        ]
      },
      A: {
        title: 'Add A Record',
        steps: [
          'Log into your domain registrar or DNS provider',
          `Find the DNS settings for ${domain}`,
          'Add a new A record with these values:',
          `  - Type: A`,
          `  - Name: ${domain}`,
          `  - Value: [Your server IP]`,
          `  - TTL: 300 (or leave default)`,
          'Save the changes',
          'Wait for DNS propagation (up to 24 hours)',
          'Click "Verify DNS" to check the configuration'
        ]
      }
    };

    return instructions[recordType] || instructions.CNAME;
  }
}

module.exports = new DomainService();