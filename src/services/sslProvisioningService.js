const Domain = require("../models/Domain");
const sslCertificateService = require("./sslCertificateService");
const nginxConfigService = require("./nginxConfigService");
const logger = require("../config/logger");

class SSLProvisioningService {
  /**
   * Full SSL provisioning flow for a verified custom domain.
   *
   * Flow:
   *   [1] Write HTTP-only nginx config + enable + reload
   *       (nginx must be serving ACME challenge BEFORE certbot runs)
   *   [2] Run certbot with retry — issues Let's Encrypt cert
   *   [3] Write SSL nginx config + enable + reload
   *   [4] Persist ssl status + expiry in MongoDB
   *
   * If step [2] fails, the domain stays in HTTP-only mode (still reachable).
   * ssl.status is set to 'failed' and the error is recorded.
   * The caller decides whether to surface this as a fatal error.
   */
  async provision(domainId) {
    const domainDoc = await Domain.findById(domainId);
    if (!domainDoc) throw new Error(`Domain not found: ${domainId}`);

    if (domainDoc.verificationStatus !== "verified") {
      throw new Error(
        `Domain ${domainDoc.fullDomain} must be verified before SSL can be provisioned`,
      );
    }

    const domain = domainDoc.fullDomain;

    // ── Step 1: HTTP-only nginx config ──────────────────────────────────────
    logger.info(`[SSL] [${domain}] Writing HTTP-only nginx config…`);
    try {
      nginxConfigService.writeHttpOnlyConfig(domain);
      nginxConfigService.enableSite(domain);
      nginxConfigService.reloadNginx();
    } catch (err) {
      const msg = `Failed to write/enable HTTP-only nginx config: ${err.message}`;
      logger.error(`[SSL] [${domain}] ${msg}`);
      await this._updateSSLStatus(domainDoc, "failed", null, msg);
      throw new Error(msg);
    }

    // ── Step 2: Request certificate (with retry) ────────────────────────────
    logger.info(`[SSL] [${domain}] Requesting Let's Encrypt certificate…`);
    let certStatus;
    try {
      certStatus =
        await sslCertificateService.requestCertificateWithRetry(domain);
    } catch (err) {
      const msg = `Certificate issuance failed: ${err.message}`;
      logger.error(`[SSL] [${domain}] ${msg}`);
      // Domain stays HTTP-only — do NOT remove the nginx config.
      await this._updateSSLStatus(domainDoc, "failed", null, msg);
      // Return a non-throwing result so the API can still respond 200 with ssl_status: 'failed'
      return { success: false, domain, sslEnabled: false, error: msg };
    }

    // ── Step 3: SSL nginx config ────────────────────────────────────────────
    logger.info(`[SSL] [${domain}] Writing SSL nginx config…`);
    try {
      nginxConfigService.writeSSLConfig(domain);
      nginxConfigService.enableSite(domain);
      nginxConfigService.reloadNginx();
    } catch (err) {
      const msg = `Failed to write/enable SSL nginx config: ${err.message}`;
      logger.error(`[SSL] [${domain}] ${msg}`);
      await this._updateSSLStatus(domainDoc, "failed", null, msg);
      return { success: false, domain, sslEnabled: false, error: msg };
    }

    // ── Step 4: Persist SSL state ───────────────────────────────────────────
    const certInfo = sslCertificateService.checkCertificateStatus(domain);
    const nginxConfigPath = nginxConfigService.siteEnabled(domain)
      ? require("path").join(
          process.env.NGINX_SITES_ENABLED || "/etc/nginx/sites-enabled",
          `${domain}.conf`,
        )
      : null;

    await this._updateSSLStatus(
      domainDoc,
      "active",
      certInfo.expiresAt,
      null,
      nginxConfigPath,
    );

    logger.info(
      `[SSL] [${domain}] SSL provisioning complete. Expires: ${certInfo.expiresAt}`,
    );
    return {
      success: true,
      domain,
      sslEnabled: true,
      expiresAt: certInfo.expiresAt,
    };
  }

  /**
   * Revoke + remove SSL for a domain (called on domain deletion).
   * Non-throwing — logs errors but doesn't propagate them so domain deletion can proceed.
   */
  async deprovision(domainId) {
    const domainDoc = await Domain.findById(domainId);
    if (!domainDoc) return;

    const domain = domainDoc.fullDomain;
    logger.info(`[SSL] [${domain}] Deprovisioning SSL…`);

    try {
      nginxConfigService.removeSite(domain);
      nginxConfigService.reloadNginx();
    } catch (err) {
      logger.warn(
        `[SSL] [${domain}] Could not remove nginx config: ${err.message}`,
      );
    }

    try {
      await sslCertificateService.deleteCertificate(domain);
    } catch (err) {
      logger.warn(
        `[SSL] [${domain}] Could not delete certificate: ${err.message}`,
      );
    }
  }

  /**
   * Run certbot renew and copy updated certs to nginx's SSL dir.
   * Called by the monthly cron job.
   */
  async renewAll() {
    logger.info("[SSL] Running certificate renewal…");
    await sslCertificateService.renewCertificates();

    // Copy renewed certs for all active SSL domains and reload nginx once.
    const activeDomains = await Domain.find({
      "ssl.status": "active",
      "ssl.autoRenewal": true,
    });

    for (const domainDoc of activeDomains) {
      try {
        await sslCertificateService.copyCertificateToNginx(
          domainDoc.fullDomain,
        );
        const certInfo = sslCertificateService.checkCertificateStatus(
          domainDoc.fullDomain,
        );
        if (certInfo.expiresAt) {
          domainDoc.ssl.expiresAt = certInfo.expiresAt;
          domainDoc.ssl.lastRenewal = new Date();
          await domainDoc.save();
        }
      } catch (err) {
        logger.warn(
          `[SSL] Renewal copy failed for ${domainDoc.fullDomain}: ${err.message}`,
        );
      }
    }

    try {
      nginxConfigService.reloadNginx();
    } catch (err) {
      logger.warn("[SSL] Nginx reload after renewal failed:", err.message);
    }

    logger.info(
      `[SSL] Renewal pass complete. Processed ${activeDomains.length} domain(s).`,
    );
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  async _updateSSLStatus(
    domainDoc,
    status,
    expiresAt,
    errorMessage,
    nginxConfigPath,
  ) {
    domainDoc.ssl.status = status;
    domainDoc.ssl.enabled = status === "active";
    domainDoc.ssl.provider = "letsencrypt";

    if (status === "active") {
      domainDoc.ssl.lastRenewal = new Date();
      if (expiresAt) domainDoc.ssl.expiresAt = expiresAt;
      if (nginxConfigPath) domainDoc.nginxConfigPath = nginxConfigPath;
      // Clear any previous error
      domainDoc.ssl.error = undefined;
    }

    if (status === "failed" && errorMessage) {
      domainDoc.ssl.error = errorMessage.substring(0, 500);
    }

    await domainDoc.save();
  }
}

module.exports = new SSLProvisioningService();
