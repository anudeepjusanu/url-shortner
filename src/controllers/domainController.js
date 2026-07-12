const Domain = require("../models/Domain");
const Url = require("../models/Url");
const domainService = require("../services/domainService");
const sslProvisioningService = require("../services/sslProvisioningService");
const sslCertificateService = require("../services/sslCertificateService");
const { cacheGet, cacheSet, cacheDel } = require("../config/redis");
const config = require("../config/environment");
const logger = require("../config/logger");
const projectAccessService = require("../services/projectAccessService");

// Enterprise RBAC: projectAccessService throws ForbiddenError/NotFoundError/
// ValidationError (each carrying a .statusCode). See urlController.js for
// the same pattern.
const sendIfAccessError = (error, res) => {
  if (!error.statusCode) return false;
  res.status(error.statusCode).json({ success: false, message: error.message });
  return true;
};

// Helper function to clear domain cache for a user
const clearDomainCache = async (userId) => {
  try {
    // Clear various cache patterns
    await cacheDel(`domains:user:${userId}`);
    // Note: Redis pattern deletion would require a different approach
    // For now, we'll just clear the main cache key
  } catch (error) {
    logger.error("Cache clear error:", error);
  }
};

// domain.owner may be a bare ObjectId or a populated User doc depending on
// the query that fetched it — normalize both to a comparable id string.
const idOf = (value) => (value && value._id ? value._id : value)?.toString();

// Enterprise RBAC + legacy access checks for an existing domain. Platform
// admins (user.role === 'admin' — Snip's internal staff role, unrelated to
// project roles) can always access any domain. Solo accounts: owner-only,
// unchanged pre-RBAC behavior. Enterprise accounts: governed by the
// domain's own project + the caller's current role there — a Viewer gets
// canViewDomain but not canEditDomain.
const canViewDomain = async (domain, user) => {
  if (user.role === "admin") return true;
  if (!user.organization) {
    return idOf(domain.owner) === user.id.toString();
  }
  try {
    await projectAccessService.assertCanViewResource(user, domain);
    return true;
  } catch (error) {
    if (error.statusCode) return false;
    throw error;
  }
};

const canEditDomain = async (domain, user) => {
  if (user.role === "admin") return true;
  if (!user.organization) {
    return idOf(domain.owner) === user.id.toString();
  }
  try {
    await projectAccessService.assertCanEditResource(user, domain);
    return true;
  } catch (error) {
    if (error.statusCode) return false;
    throw error;
  }
};

const addDomain = async (req, res) => {
  try {
    let { domain, subdomain, isDefault = false, projectId } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Domain name is required",
      });
    }

    // Enterprise RBAC: resolves to null for solo accounts; for enterprise
    // accounts, requires projectId + a write-capable role and 403s Viewers.
    const resolvedProjectId = await projectAccessService.resolveWriteProject(
      req.user,
      projectId,
    );

    // Validate domain format using Punycode-aware validator
    const { validateDomain, domainToASCII } = require("../utils/punycode");
    const validation = validateDomain(domain);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Use the normalized (ASCII/Punycode) domain for storage
    domain = validation.normalizedDomain;

    const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

    // Check if domain already exists (multiple checks for comprehensive coverage)
    const existingDomain = await Domain.findOne({
      $or: [
        { fullDomain: fullDomain.toLowerCase() },
        { domain: domain.toLowerCase() },
      ],
    });

    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: "Domain is already registered in the system",
      });
    }

    // Generate CNAME record details
    const cnameRecord = await domainService.generateCNAMERecord(
      domain,
      subdomain,
    );

    // Create domain
    const domainData = {
      domain: domain.toLowerCase(),
      subdomain: subdomain?.toLowerCase(),
      fullDomain: fullDomain.toLowerCase(),
      owner: req.user.id,
      organization: req.user.organization,
      project: resolvedProjectId,
      isDefault,
      verificationRecord: {
        type: "CNAME",
        name: fullDomain.toLowerCase(),
        value: cnameRecord.value,
        verified: false,
      },
      metadata: {
        addedBy: req.user.id,
      },
    };

    const newDomain = new Domain(domainData);
    await newDomain.save();

    logger.info("Domain saved successfully:", {
      id: newDomain._id,
      fullDomain: newDomain.fullDomain,
      owner: newDomain.owner,
    });

    const populatedDomain = await Domain.findById(newDomain._id)
      .populate("owner", "firstName lastName email")
      .populate("organization", "name slug")
      .populate("metadata.addedBy", "firstName lastName email");

    // Clear user domains cache
    await clearDomainCache(req.user.id);

    res.status(201).json({
      success: true,
      message: "Domain added successfully",
      data: {
        domain: populatedDomain,
        cnameTarget: domainService.cnameTarget,
        setupInstructions: domainService.getSetupInstructions(
          fullDomain,
          "CNAME",
        ),
      },
    });
  } catch (error) {
    if (sendIfAccessError(error, res)) return;
    logger.error("Add domain error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      let field = "domain";
      if (error.keyValue) {
        field = Object.keys(error.keyValue)[0];
      }
      return res.status(400).json({
        success: false,
        message: `This ${field} is already registered in the system`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add domain",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getDomains = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      verificationStatus,
      sortBy = "createdAt",
      sortOrder = "desc",
      projectId,
    } = req.query;

    // Temporarily disable caching for debugging
    // const cacheKey = `domains:user:${req.user.id}:${JSON.stringify(req.query)}`;
    // const cached = await cacheGet(cacheKey);

    // if (cached) {
    //   return res.json({
    //     success: true,
    //     data: cached
    //   });
    // }

    const skip = (page - 1) * limit;

    // Enterprise RBAC: {} for solo accounts (unchanged below), { project }
    // for a specific project, or { organization } for the Account Owner's
    // "All projects" aggregate.
    const scope = await projectAccessService.resolveReadScope(
      req.user,
      projectId,
    );
    const filter = { ...scope };
    if (!req.user.organization) {
      filter.owner = req.user.id;
    }

    logger.info("getDomains filter:", filter);
    logger.info("User ID:", req.user.id);
    logger.info("User org:", req.user.organization);

    if (search) {
      filter.$or = [
        { domain: { $regex: search, $options: "i" } },
        { subdomain: { $regex: search, $options: "i" } },
        { fullDomain: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [domains, total] = await Promise.all([
      Domain.find(filter)
        .populate("owner", "firstName lastName email")
        .populate("organization", "name slug")
        .populate("metadata.addedBy", "firstName lastName email")
        .populate("metadata.verifiedBy", "firstName lastName email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Domain.countDocuments(filter),
    ]);

    logger.info("getDomains result:", {
      totalFound: total,
      domainsCount: domains.length,
      domains: domains.map((d) => ({
        id: d._id,
        fullDomain: d.fullDomain,
        owner: d.owner,
      })),
    });

    const result = {
      domains,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Temporarily disable caching for debugging
    // await cacheSet(cacheKey, result, config.CACHE_TTL.DOMAIN_CACHE || 300);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (sendIfAccessError(error, res)) return;
    logger.error("Get domains error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch domains",
    });
  }
};

const getDomain = async (req, res) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findById(id)
      .populate("owner", "firstName lastName email")
      .populate("organization", "name slug")
      .populate("metadata.addedBy", "firstName lastName email")
      .populate("metadata.verifiedBy", "firstName lastName email");

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    // Check access permissions
    if (!(await canViewDomain(domain, req.user))) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get additional domain info
    const [domainInfo, urlCount] = await Promise.all([
      domainService.getDomainInfo(domain.fullDomain),
      Url.countDocuments({ domain: domain.fullDomain }),
    ]);

    res.json({
      success: true,
      data: {
        domain,
        domainInfo,
        urlCount,
        setupInstructions: domainService.getSetupInstructions(
          domain.fullDomain,
          domain.verificationRecord.type,
        ),
      },
    });
  } catch (error) {
    logger.error("Get domain error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch domain",
    });
  }
};

const updateDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault, notes, configuration } = req.body;

    const domain = await Domain.findById(id);

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    // Check access permissions
    if (!(await canEditDomain(domain, req.user))) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied - You do not have permission to access this domain",
      });
    }

    const updateData = {};

    if (isDefault !== undefined) {
      updateData.isDefault = isDefault;
      if (isDefault) {
        // Unset other default domains
        await Domain.updateMany(
          {
            owner: req.user.id,
            _id: { $ne: id },
          },
          { isDefault: false },
        );
      }
    }

    if (notes !== undefined) {
      updateData["metadata.notes"] = notes;
    }

    if (configuration !== undefined) {
      updateData.configuration = { ...domain.configuration, ...configuration };
    }

    const updatedDomain = await Domain.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("owner", "firstName lastName email")
      .populate("organization", "name slug")
      .populate("metadata.addedBy", "firstName lastName email")
      .populate("metadata.verifiedBy", "firstName lastName email");

    // Clear cache
    await cacheDel(`domains:user:${req.user.id}`);

    res.json({
      success: true,
      message: "Domain updated successfully",
      data: { domain: updatedDomain },
    });
  } catch (error) {
    logger.error("Update domain error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update domain",
    });
  }
};

const deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findById(id);

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    // Check access permissions
    if (!(await canEditDomain(domain, req.user))) {
      return res.status(403).json({
        success: false,
        message: "Access denied - You can only delete domains that you own",
      });
    }

    // Check if domain has URLs
    const urlCount = await Url.countDocuments({ domain: domain.fullDomain });
    if (urlCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete domain. ${urlCount} URLs are using this domain. Please move or delete them first.`,
      });
    }

    await Domain.findByIdAndDelete(id);

    // Clear cache
    await cacheDel(`domains:user:${req.user.id}`);

    res.json({
      success: true,
      message: "Domain deleted successfully",
    });
  } catch (error) {
    logger.error("Delete domain error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete domain",
    });
  }
};

const verifyDomain = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info("Verifying domain ID:", id);

    const domain = await Domain.findById(id);
    logger.info("Found domain:", domain);

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    // Check access permissions
    if (!(await canEditDomain(domain, req.user))) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied - You do not have permission to verify this domain",
      });
    }

    const verificationResult = await domainService.checkDomainVerification(id);

    // Clear cache
    await cacheDel(`domains:user:${req.user.id}`);

    if (verificationResult.success) {
      res.json({
        success: true,
        message: "Domain verification successful",
        data: {
          verified: verificationResult.verified,
          domain: verificationResult.domain,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: verificationResult.error || "Domain verification failed",
        data: {
          verified: false,
          details: verificationResult.details,
        },
      });
    }
  } catch (error) {
    logger.error("Verify domain error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify domain",
    });
  }
};

const setDefaultDomain = async (req, res) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findById(id);

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    // Check access permissions
    if (!(await canEditDomain(domain, req.user))) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied - You do not have permission to access this domain",
      });
    }

    if (!domain.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Cannot set unverified domain as default",
      });
    }

    await domain.setAsDefault();

    // Clear cache
    await cacheDel(`domains:user:${req.user.id}`);

    res.json({
      success: true,
      message: "Default domain updated successfully",
      data: { domain },
    });
  } catch (error) {
    logger.error("Set default domain error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set default domain",
    });
  }
};

const getDomainStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization;

    const filter = {
      owner: userId,
    };

    if (organizationId) {
      filter.$or = [{ owner: userId }, { organization: organizationId }];
    }

    const [totalDomains, verifiedDomains, activeDomains, pendingDomains] =
      await Promise.all([
        Domain.countDocuments(filter),
        Domain.countDocuments({ ...filter, verificationStatus: "verified" }),
        Domain.countDocuments({ ...filter, status: "active" }),
        Domain.countDocuments({ ...filter, verificationStatus: "pending" }),
      ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalDomains,
          verifiedDomains,
          activeDomains,
          pendingDomains,
        },
      },
    });
  } catch (error) {
    logger.error("Get domain stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch domain statistics",
    });
  }
};

const getDomainInfo = async (req, res) => {
  try {
    const { domain } = req.params;

    const domainInfo = await domainService.getDomainInfo(domain);
    const dnsProviders = await domainService.detectDNSProvider(domain);

    res.json({
      success: true,
      data: {
        domain,
        info: domainInfo,
        providers: dnsProviders,
        setupInstructions: domainService.getSetupInstructions(domain, "CNAME"),
      },
    });
  } catch (error) {
    logger.error("Get domain info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch domain information",
    });
  }
};

// POST /api/domains/:id/provision-ssl
// Triggers SSL certificate provisioning for a verified custom domain.
// Runs asynchronously — responds immediately with 202, provisioning continues in background.
const provisionSSL = async (req, res) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findById(id);
    if (!domain) {
      return res
        .status(404)
        .json({ success: false, message: "Domain not found" });
    }

    if (!(await canEditDomain(domain, req.user))) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (domain.verificationStatus !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Domain must be verified before SSL can be provisioned",
      });
    }

    if (domain.ssl.status === "active") {
      return res.status(400).json({
        success: false,
        message: "SSL is already active for this domain",
      });
    }

    // Respond immediately — provisioning can take 30-120 s (certbot + DNS).
    // Client should poll GET /api/domains/:id/ssl-status.
    res.status(202).json({
      success: true,
      message: "SSL provisioning started. Poll /ssl-status to track progress.",
      data: { domainId: id, domain: domain.fullDomain },
    });

    // Fire-and-forget provisioning in background.
    sslProvisioningService.provision(id).catch((err) => {
      logger.error(
        `[SSL] Background provisioning failed for ${domain.fullDomain}:`,
        err.message,
      );
    });
  } catch (error) {
    logger.error("Provision SSL error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to start SSL provisioning" });
  }
};

// GET /api/domains/:id/ssl-status
// Returns the current SSL state including status, expiry, and any error message.
const getSSLStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findById(id);
    if (!domain) {
      return res
        .status(404)
        .json({ success: false, message: "Domain not found" });
    }

    if (!(await canViewDomain(domain, req.user))) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // If cert is active, also read live expiry from disk (catches renewals not yet in DB).
    let liveCertInfo = null;
    if (domain.ssl.status === "active") {
      liveCertInfo = sslCertificateService.checkCertificateStatus(
        domain.fullDomain,
      );
    }

    res.json({
      success: true,
      data: {
        domain: domain.fullDomain,
        ssl: {
          enabled: domain.ssl.enabled,
          status: domain.ssl.status,
          provider: domain.ssl.provider,
          expiresAt: liveCertInfo?.expiresAt || domain.ssl.expiresAt,
          daysRemaining: liveCertInfo?.daysRemaining ?? null,
          lastRenewal: domain.ssl.lastRenewal,
          autoRenewal: domain.ssl.autoRenewal,
          error: domain.ssl.error || null,
        },
        url: domain.shortUrl,
      },
    });
  } catch (error) {
    logger.error("Get SSL status error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch SSL status" });
  }
};

// POST /api/domains/reset-ssl
// Admin only — resets ssl.status to 'pending' for all verified domains with failed or pending SSL.
// The hourly cron will then retry provisioning for all of them automatically.
const resetPendingSSL = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const result = await Domain.updateMany(
      {
        verificationStatus: "verified",
        "ssl.status": { $in: ["failed", "pending"] },
      },
      {
        $set: {
          "ssl.status": "pending",
          "ssl.enabled": true,
          "ssl.error": null,
        },
      },
    );

    const domains = await Domain.find(
      { verificationStatus: "verified", "ssl.status": "pending" },
      { fullDomain: 1, "ssl.status": 1 },
    );

    res.json({
      success: true,
      message: `Reset ${result.modifiedCount} domain(s). Hourly cron will provision them automatically.`,
      data: {
        resetCount: result.modifiedCount,
        domains: domains.map((d) => d.fullDomain),
      },
    });
  } catch (error) {
    logger.error("Reset pending SSL error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to reset SSL status" });
  }
};

module.exports = {
  addDomain,
  getDomains,
  getDomain,
  updateDomain,
  deleteDomain,
  verifyDomain,
  setDefaultDomain,
  getDomainStats,
  getDomainInfo,
  provisionSSL,
  getSSLStatus,
  resetPendingSSL,
};
