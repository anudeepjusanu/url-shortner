const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADMIN_EMAIL = process.env.SSL_ADMIN_EMAIL || 'admin@laghhu.link';
const WEBROOT_PATH = process.env.CERTBOT_WEBROOT || '/var/www/certbot';
// NGINX_SSL_WRITE_DIR is the HOST path where cert files are physically written.
// When nginx runs in Docker, this differs from NGINX_SSL_DIR (the container-internal path
// used in nginx config text). Set NGINX_SSL_WRITE_DIR to the host volume mount path.
const NGINX_SSL_WRITE_DIR = process.env.NGINX_SSL_WRITE_DIR || process.env.NGINX_SSL_DIR || '/etc/nginx/ssl';
const LETSENCRYPT_DIR = process.env.LETSENCRYPT_DIR || '/etc/letsencrypt';
const USE_SUDO = process.env.SSL_USE_SUDO !== 'false';

// Errors that are safe to retry (transient). Duplicate-cert is NOT here — retrying it burns rate limit.
const RETRYABLE_PATTERNS = [
  /SERVFAIL/i,
  /CAA.*timeout/i,
  /connection refused/i,
  /connection reset/i,
  /Timeout/i,
  /too many requests/i,
  /urn:ietf:params:acme:error:serverInternal/i,
];

const RETRY_CONFIG = [
  { delayMs: 30_000 },
  { delayMs: 60_000 },
  { delayMs: 120_000 },
];

class SSLCertificateService {
  // ─── Public API ────────────────────────────────────────────────────────────

  async requestCertificate(domain) {
    this._ensureWebrootDir();

    // Always delete any existing cert first to prevent certbot from
    // silently reusing a cert whose CN doesn't match (SSL_WRONG_COMMON_NAME incident).
    await this.deleteCertificate(domain);

    const certbotArgs = [
      'certonly', '--webroot',
      '-w', WEBROOT_PATH,
      '-d', domain,
      '--cert-name', domain,
      '--email', ADMIN_EMAIL,
      '--agree-tos', '--non-interactive',
      '--force-renewal',
    ];

    const result = this._runCertbot(certbotArgs);

    if (!result.success) {
      const message = this._parseCertbotError(result.stderr, result.stdout);
      throw new Error(`Certbot failed for ${domain}: ${message}`);
    }

    // Fix permissions so the node process (non-root) can read the issued cert.
    this._fixPermissions(domain);

    // Defend against certbot reusing a wrong-CN cert (SSL_WRONG_COMMON_NAME incident).
    const certPath = path.join(LETSENCRYPT_DIR, 'live', domain, 'fullchain.pem');
    this._verifyCertificateCN(certPath, domain);

    // Copy cert + key into nginx's SSL directory.
    await this.copyCertificateToNginx(domain);

    return { success: true, domain };
  }

  async requestCertificateWithRetry(domain) {
    let lastError;

    for (let attempt = 0; attempt <= RETRY_CONFIG.length; attempt++) {
      try {
        return await this.requestCertificate(domain);
      } catch (err) {
        lastError = err;

        const isRetryable = RETRYABLE_PATTERNS.some(p => p.test(err.message));
        const hasRetryLeft = attempt < RETRY_CONFIG.length;

        if (!isRetryable || !hasRetryLeft) {
          throw err;
        }

        const { delayMs } = RETRY_CONFIG[attempt];
        console.warn(`[SSL] Attempt ${attempt + 1} failed for ${domain}: ${err.message}. Retrying in ${delayMs / 1000}s…`);
        await this._sleep(delayMs);
      }
    }

    throw lastError;
  }

  async renewCertificates() {
    const result = this._runCertbot(['renew', '--quiet', '--webroot', '-w', WEBROOT_PATH]);
    if (!result.success) {
      const message = this._parseCertbotError(result.stderr, result.stdout);
      throw new Error(`Certbot renew failed: ${message}`);
    }
    return { success: true };
  }

  async deleteCertificate(domain) {
    try {
      const certExists = fs.existsSync(path.join(LETSENCRYPT_DIR, 'live', domain));
      if (!certExists) return { success: true, skipped: true };

      const result = this._runCertbot(['delete', '--cert-name', domain, '--non-interactive']);
      if (!result.success) {
        // Non-fatal — log and continue so requestCertificate can still proceed.
        console.warn(`[SSL] Could not delete existing cert for ${domain}: ${result.stderr}`);
      }
      return { success: true };
    } catch (err) {
      console.warn(`[SSL] deleteCertificate error for ${domain}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  async copyCertificateToNginx(domain) {
    const srcDir = path.join(LETSENCRYPT_DIR, 'live', domain);
    const destDir = path.join(NGINX_SSL_WRITE_DIR, domain);

    if (!fs.existsSync(srcDir)) {
      throw new Error(`Certificate source directory not found: ${srcDir}`);
    }

    fs.mkdirSync(destDir, { recursive: true });

    fs.copyFileSync(path.join(srcDir, 'fullchain.pem'), path.join(destDir, 'fullchain.pem'));
    fs.copyFileSync(path.join(srcDir, 'privkey.pem'), path.join(destDir, 'privkey.pem'));

    return { destDir };
  }

  checkCertificateStatus(domain) {
    const certPath = path.join(NGINX_SSL_WRITE_DIR, domain, 'fullchain.pem');

    if (!fs.existsSync(certPath)) {
      return { exists: false, domain };
    }

    try {
      const cmd = `openssl x509 -in ${certPath} -noout -enddate`;
      const output = execSync(cmd, { encoding: 'utf8' }).trim();
      // output: "notAfter=May 25 12:00:00 2026 GMT"
      const dateStr = output.replace('notAfter=', '');
      const expiresAt = new Date(dateStr);
      const daysRemaining = Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

      return { exists: true, domain, expiresAt, daysRemaining, expired: daysRemaining <= 0 };
    } catch (err) {
      return { exists: true, domain, error: err.message };
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  _verifyCertificateCN(certPath, expectedDomain) {
    try {
      const cmd = `openssl x509 -in ${certPath} -noout -subject`;
      const output = execSync(cmd, { encoding: 'utf8' });

      // subject line looks like: "subject=CN = example.com" or "subject= /CN=example.com"
      const match = output.match(/CN\s*=\s*([^\s,/]+)/i);
      if (!match) {
        throw new Error(`Could not parse CN from cert: ${output.trim()}`);
      }

      const cn = match[1].toLowerCase().trim();
      const expected = expectedDomain.toLowerCase().trim();

      if (cn !== expected) {
        throw new Error(`Certificate CN mismatch: expected "${expected}", got "${cn}". Aborting to prevent wrong-cert deployment.`);
      }
    } catch (err) {
      if (err.message.includes('CN mismatch') || err.message.includes('Could not parse')) {
        throw err;
      }
      // openssl not available or cert unreadable — warn but don't block
      console.warn(`[SSL] CN verification skipped for ${expectedDomain}: ${err.message}`);
    }
  }

  _fixPermissions(domain) {
    if (!USE_SUDO) return;
    try {
      execSync(`sudo chown -R $(whoami):$(whoami) ${LETSENCRYPT_DIR}`, { stdio: 'ignore' });
      execSync(`sudo chmod 755 ${LETSENCRYPT_DIR}/live ${LETSENCRYPT_DIR}/archive`, { stdio: 'ignore' });

      const archiveDir = path.join(LETSENCRYPT_DIR, 'archive', domain);
      if (fs.existsSync(archiveDir)) {
        execSync(`sudo chmod 644 ${archiveDir}/privkey*.pem`, { stdio: 'ignore' });
      }
    } catch (err) {
      // Non-fatal — if the copy step below also fails, that error is the real signal.
      console.warn(`[SSL] Permission fixup warning for ${domain}: ${err.message}`);
    }
  }

  _ensureWebrootDir() {
    const challengeDir = path.join(WEBROOT_PATH, '.well-known', 'acme-challenge');
    fs.mkdirSync(challengeDir, { recursive: true });
  }

  _runCertbot(args) {
    const cmd = USE_SUDO ? 'sudo' : 'certbot';
    const fullArgs = USE_SUDO ? ['certbot', ...args] : args;

    const result = spawnSync(cmd, fullArgs, {
      encoding: 'utf8',
      timeout: 120_000,
    });

    return {
      success: result.status === 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      status: result.status,
    };
  }

  // Extracts the meaningful error line from certbot's verbose output.
  // Without this, logs fill with "Saving debug log to …" noise (SSL_CERTBOT_ERROR_PARSING incident).
  _parseCertbotError(stderr, stdout) {
    const combined = `${stderr}\n${stdout}`;
    const lines = combined.split('\n');

    const patterns = [
      /DNS problem:/i,
      /Detail:/i,
      /\bType:\s*urn:/i,
      /\[Errno \d+\]/,
      /Error:/i,
      /failed/i,
      /Timeout/i,
      /rate limit/i,
    ];

    for (const pattern of patterns) {
      const match = lines.find(l => pattern.test(l));
      if (match) {
        const cleaned = match.trim().replace(/^\s*-\s*/, '');
        if (!cleaned.toLowerCase().includes('saving debug log')) {
          return cleaned;
        }
      }
    }

    // Fall back to last non-empty, non-debug line
    const fallback = lines
      .map(l => l.trim())
      .filter(l => l && !l.toLowerCase().includes('saving debug log'))
      .pop();

    return fallback || 'Unknown certbot error';
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new SSLCertificateService();
