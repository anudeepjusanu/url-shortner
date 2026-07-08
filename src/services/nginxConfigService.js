const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SITES_AVAILABLE =
  process.env.NGINX_SITES_AVAILABLE || "/etc/nginx/sites-available";
const SITES_ENABLED =
  process.env.NGINX_SITES_ENABLED || "/etc/nginx/sites-enabled";
const NGINX_SSL_DIR = process.env.NGINX_SSL_DIR || "/etc/nginx/ssl";
// When nginx runs in Docker, use BACKEND_HOST=172.18.0.1 (Docker host gateway).
// For non-Docker setups, 127.0.0.1 is correct.
const BACKEND_HOST = process.env.BACKEND_HOST || "127.0.0.1";
const BACKEND_PORT = process.env.PORT || 3015;
const NGINX_CONTAINER = process.env.NGINX_CONTAINER_NAME || null; // set if nginx runs in Docker

// These configs must never be deleted regardless of what the caller asks.
const PROTECTED_DOMAINS = new Set(
  (
    process.env.PROTECTED_DOMAINS ||
    "laghhu.link,www.laghhu.link,shortener.laghhu.link"
  )
    .split(",")
    .map((d) => d.trim().toLowerCase()),
);

class NginxConfigService {
  // ─── Config generation ──────────────────────────────────────────────────────

  // Step 1: HTTP-only config written BEFORE certbot runs.
  // ACME challenge location must come first so Let's Encrypt can reach it.
  generateHttpOnlyConfig(domain) {
    return `# HTTP-only config for ${domain} — managed by url-shortener ssl provisioner
# owner-port: ${BACKEND_PORT}
# DO NOT edit manually; it will be overwritten on next SSL provisioning run.
server {
    listen 80;
    server_name ${domain};

    # ACME challenge — must be first; Let's Encrypt needs HTTP access before a cert exists.
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        default_type text/plain;
        allow all;
    }

    location / {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Custom-Domain $host;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }
}
`;
  }

  // Step 2: Full SSL config written AFTER certbot successfully issues the cert.
  generateSSLConfig(domain) {
    const certDir = path.join(NGINX_SSL_DIR, domain);
    return `# SSL config for ${domain} — managed by url-shortener ssl provisioner
# owner-port: ${BACKEND_PORT}
# DO NOT edit manually; it will be overwritten on next SSL provisioning run.

# HTTP → HTTPS redirect (ACME challenge preserved for renewals)
server {
    listen 80;
    server_name ${domain};

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        default_type text/plain;
        allow all;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate ${certDir}/fullchain.pem;
    ssl_certificate_key ${certDir}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        default_type text/plain;
        allow all;
    }

    location / {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Custom-Domain $host;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }
}
`;
  }

  // ─── Site management ────────────────────────────────────────────────────────

  writeHttpOnlyConfig(domain) {
    this._ensureDirs();
    this._assertOwnership(domain);
    const configPath = path.join(SITES_AVAILABLE, `${domain}.conf`);
    fs.writeFileSync(configPath, this.generateHttpOnlyConfig(domain), "utf8");
    return configPath;
  }

  writeSSLConfig(domain) {
    this._ensureDirs();
    this._assertOwnership(domain);
    const configPath = path.join(SITES_AVAILABLE, `${domain}.conf`);
    fs.writeFileSync(configPath, this.generateSSLConfig(domain), "utf8");
    return configPath;
  }

  // Use fs.copyFileSync, NOT symlinks.
  // Symlinks break across Docker volume mounts because the container sees
  // a link pointing to a host path it can't resolve (symlink-vs-copy incident).
  enableSite(domain) {
    const src = path.join(SITES_AVAILABLE, `${domain}.conf`);
    const dest = path.join(SITES_ENABLED, `${domain}.conf`);

    if (!fs.existsSync(src)) {
      throw new Error(`Config not found in sites-available: ${src}`);
    }

    fs.copyFileSync(src, dest);
    return dest;
  }

  removeSite(domain) {
    if (PROTECTED_DOMAINS.has(domain.toLowerCase())) {
      throw new Error(
        `Refusing to remove config for protected domain: ${domain}`,
      );
    }

    const available = path.join(SITES_AVAILABLE, `${domain}.conf`);
    const enabled = path.join(SITES_ENABLED, `${domain}.conf`);

    if (fs.existsSync(enabled)) fs.unlinkSync(enabled);
    if (fs.existsSync(available)) fs.unlinkSync(available);
  }

  // ─── Nginx reload ───────────────────────────────────────────────────────────

  reloadNginx() {
    // If nginx runs in a Docker container, exec into it to reload.
    // Otherwise reload the host nginx process directly.
    const testCmd = NGINX_CONTAINER
      ? `docker exec ${NGINX_CONTAINER} nginx -t`
      : "nginx -t";

    const reloadCmd = NGINX_CONTAINER
      ? `docker exec ${NGINX_CONTAINER} nginx -s reload`
      : "nginx -s reload";

    try {
      execSync(testCmd, { encoding: "utf8", timeout: 15_000 });
      execSync(reloadCmd, { encoding: "utf8", timeout: 15_000 });
    } catch (err) {
      throw new Error(`Nginx reload failed: ${err.message}`);
    }
  }

  // Test config syntax without reloading — useful for pre-flight checks.
  testConfig() {
    const cmd = NGINX_CONTAINER
      ? `docker exec ${NGINX_CONTAINER} nginx -t`
      : "nginx -t";

    try {
      execSync(cmd, { encoding: "utf8", timeout: 15_000 });
      return { valid: true };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  siteEnabled(domain) {
    return fs.existsSync(path.join(SITES_ENABLED, `${domain}.conf`));
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  // A single nginx instance can front multiple environments (e.g. prod on
  // port 3015 and QA on port 3020) that share this same sites-available
  // directory. If the same hostname gets verified as a custom domain in two
  // environments, each one's SSL provisioning would otherwise silently
  // overwrite the other's config on every re-provision/retry, permanently
  // flipping which backend the domain resolves to. Refuse the write instead —
  // whoever needs to reassign a domain must remove/deactivate it in the other
  // environment first, then delete the stale .conf file here before retrying.
  _assertOwnership(domain) {
    const configPath = path.join(SITES_AVAILABLE, `${domain}.conf`);
    if (!fs.existsSync(configPath)) return;

    const existing = fs.readFileSync(configPath, "utf8");
    const match = existing.match(/^# owner-port: (\d+)/m);
    if (match && match[1] !== String(BACKEND_PORT)) {
      throw new Error(
        `Domain ${domain} is already provisioned by another environment ` +
          `(port ${match[1]}); this environment is port ${BACKEND_PORT}. ` +
          `Refusing to overwrite its nginx config. Deactivate the domain in ` +
          `the owning environment and delete ${configPath} before retrying.`,
      );
    }
  }

  _ensureDirs() {
    fs.mkdirSync(SITES_AVAILABLE, { recursive: true });
    fs.mkdirSync(SITES_ENABLED, { recursive: true });
    // NGINX_SSL_DIR is the container-internal path (/etc/nginx/ssl) — never mkdir it on the host.
    // Cert files are written to NGINX_SSL_WRITE_DIR by sslCertificateService.copyCertificateToNginx().
  }
}

module.exports = new NginxConfigService();
