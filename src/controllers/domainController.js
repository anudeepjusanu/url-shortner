const Domain = require('../models/Domain');
const Url = require('../models/Url');
const domainService = require('../services/domainService');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const config = require('../config/environment');

// Helper function to clear domain cache for a user
const clearDomainCache = async (userId) => {
  try {
    // Clear various cache patterns
    await cacheDel(`domains:user:${userId}`);
    // Note: Redis pattern deletion would require a different approach
    // For now, we'll just clear the main cache key
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

// Helper function to check domain access
const checkDomainAccess = (domain, user) => {
  const domainOwnerId = domain.owner.toString();
  const userId = user.id.toString();
  const userOrgId = user.organization?.toString();
  const domainOrgId = domain.organization?.toString();

  console.log('Domain access check:', {
    domainOwnerId,
    userId,
    userOrgId,
    domainOrgId,
    isOwner: domainOwnerId === userId,
    isSameOrg: userOrgId && domainOrgId && userOrgId === domainOrgId,
    isAdmin: user.role === 'admin'
  });

  // User owns the domain
  if (domainOwnerId === userId) {
    return true;
  }

  // User's organization owns the domain
  if (userOrgId && domainOrgId && userOrgId === domainOrgId) {
    return true;
  }

  // Admin users can access all domains
  if (user.role === 'admin') {
    return true;
  }

  return false;
};

const addDomain = async (req, res) => {
  try {
    const { domain, subdomain, isDefault = false } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain name is required'
      });
    }

    // Validate domain format using Punycode-aware validator
    const { validateDomain, domainToASCII } = require('../utils/punycode');
    const validation = validateDomain(domain);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Use the normalized (ASCII/Punycode) domain for storage
    domain = validation.normalizedDomain;

    const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

    // Check if domain already exists (multiple checks for comprehensive coverage)
    const existingDomain = await Domain.findOne({
      $or: [
        { fullDomain: fullDomain.toLowerCase() },
        { domain: domain.toLowerCase() }
      ]
    });

    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is already registered in the system'
      });
    }

    // Generate CNAME record details
    const cnameRecord = await domainService.generateCNAMERecord(domain, subdomain);

    // Create domain
    const domainData = {
      domain: domain.toLowerCase(),
      subdomain: subdomain?.toLowerCase(),
      fullDomain: fullDomain.toLowerCase(),
      owner: req.user.id,
      organization: req.user.organization,
      isDefault,
      verificationRecord: {
        type: 'CNAME',
        name: fullDomain.toLowerCase(),
        value: cnameRecord.value,
        verified: false
      },
      metadata: {
        addedBy: req.user.id
      }
    };

    const newDomain = new Domain(domainData);
    await newDomain.save();

    console.log('Domain saved successfully:', {
      id: newDomain._id,
      fullDomain: newDomain.fullDomain,
      owner: newDomain.owner
    });

    const populatedDomain = await Domain.findById(newDomain._id)
      .populate('owner', 'firstName lastName email')
      .populate('organization', 'name slug')
      .populate('metadata.addedBy', 'firstName lastName email');

    // Clear user domains cache
    await clearDomainCache(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Domain added successfully',
      data: {
        domain: populatedDomain,
        setupInstructions: domainService.getSetupInstructions(fullDomain, 'CNAME')
      }
    });
  } catch (error) {
    console.error('Add domain error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      let field = 'domain';
      if (error.keyValue) {
        field = Object.keys(error.keyValue)[0];
      }
      return res.status(400).json({
        success: false,
        message: `This ${field} is already registered in the system`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add domain',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      sortBy = 'createdAt',
      sortOrder = 'desc'
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

    const filter = {
      owner: req.user.id
    };

    if (req.user.organization) {
      filter.$or = [
        { owner: req.user.id },
        { organization: req.user.organization }
      ];
    }

    console.log('getDomains filter:', filter);
    console.log('User ID:', req.user.id);
    console.log('User org:', req.user.organization);

    if (search) {
      filter.$or = [
        { domain: { $regex: search, $options: 'i' } },
        { subdomain: { $regex: search, $options: 'i' } },
        { fullDomain: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [domains, total] = await Promise.all([
      Domain.find(filter)
        .populate('owner', 'firstName lastName email')
        .populate('organization', 'name slug')
        .populate('metadata.addedBy', 'firstName lastName email')
        .populate('metadata.verifiedBy', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Domain.countDocuments(filter)
    ]);

    console.log('getDomains result:', {
      totalFound: total,
      domainsCount: domains.length,
      domains: domains.map(d => ({ id: d._id, fullDomain: d.fullDomain, owner: d.owner }))
    });

    const result = {
      domains,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Temporarily disable caching for debugging
    // await cacheSet(cacheKey, result, config.CACHE_TTL.DOMAIN_CACHE || 300);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch domains'
    });
  }
};

const getDomain = async (req, res) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findById(id)
      .populate('owner', 'firstName lastName email')
      .populate('organization', 'name slug')
      .populate('metadata.addedBy', 'firstName lastName email')
      .populate('metadata.verifiedBy', 'firstName lastName email');

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Check access permissions
    if (domain.owner._id.toString() !== req.user.id &&
        (!req.user.organization || domain.organization?._id.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get additional domain info
    const [domainInfo, urlCount] = await Promise.all([
      domainService.getDomainInfo(domain.fullDomain),
      Url.countDocuments({ domain: domain.fullDomain })
    ]);

    res.json({
      success: true,
      data: {
        domain,
        domainInfo,
        urlCount,
        setupInstructions: domainService.getSetupInstructions(domain.fullDomain, domain.verificationRecord.type)
      }
    });
  } catch (error) {
    console.error('Get domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch domain'
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
        message: 'Domain not found'
      });
    }

    // Check access permissions
    if (!checkDomainAccess(domain, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You do not have permission to access this domain'
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
            _id: { $ne: id }
          },
          { isDefault: false }
        );
      }
    }

    if (notes !== undefined) {
      updateData['metadata.notes'] = notes;
    }

    if (configuration !== undefined) {
      updateData.configuration = { ...domain.configuration, ...configuration };
    }

    const updatedDomain = await Domain.findByIdAndUpdate(id, updateData, { new: true })
      .populate('owner', 'firstName lastName email')
      .populate('organization', 'name slug')
      .populate('metadata.addedBy', 'firstName lastName email')
      .populate('metadata.verifiedBy', 'firstName lastName email');

    // Clear cache
    await cacheDel(`domains:user:${req.user.id}`);

    res.json({
      success: true,
      message: 'Domain updated successfully',
      data: { domain: updatedDomain }
    });
  } catch (error) {
    console.error('Update domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update domain'
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
        message: 'Domain not found'
      });
    }

    // Check access permissions
    // Check access permissions
    if (!checkDomainAccess(domain, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only delete domains that you own'
      });
    }

    // Check if domain has URLs
    const urlCount = await Url.countDocuments({ domain: domain.fullDomain });
    if (urlCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete domain. ${urlCount} URLs are using this domain. Please move or delete them first.`
      });
    }

    await Domain.findByIdAndDelete(id);

    // Clear cache
    await cacheDel(`domains:user:${req.user.id}`);

    res.json({
      success: true,
      message: 'Domain deleted successfully'
    });
  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete domain'
    });
  }
};

const verifyDomain = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Verifying domain ID:', id);

    const domain = await Domain.findById(id);
    console.log('Found domain:', domain);

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Check access permissions
    if (!checkDomainAccess(domain, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You do not have permission to verify this domain'
      });
    }

    const verificationResult = await domainService.checkDomainVerification(id);

    // Clear cache
    await cacheDel(`domains:user:${req.user.id}`);

    if (verificationResult.success) {
      res.json({
        success: true,
        message: 'Domain verification successful',
        data: {
          verified: verificationResult.verified,
          domain: verificationResult.domain
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: verificationResult.error || 'Domain verification failed',
        data: {
          verified: false,
          details: verificationResult.details
        }
      });
    }
  } catch (error) {
    console.error('Verify domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify domain'
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
        message: 'Domain not found'
      });
    }

    // Check access permissions
    if (!checkDomainAccess(domain, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You do not have permission to access this domain'
      });
    }

    if (!domain.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set unverified domain as default'
      });
    }

    await domain.setAsDefault();

    // Clear cache
    await cacheDel(`domains:user:${req.user.id}`);

    res.json({
      success: true,
      message: 'Default domain updated successfully',
      data: { domain }
    });
  } catch (error) {
    console.error('Set default domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default domain'
    });
  }
};

const getDomainStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization;

    const filter = {
      owner: userId
    };

    if (organizationId) {
      filter.$or = [
        { owner: userId },
        { organization: organizationId }
      ];
    }

    const [
      totalDomains,
      verifiedDomains,
      activeDomains,
      pendingDomains
    ] = await Promise.all([
      Domain.countDocuments(filter),
      Domain.countDocuments({ ...filter, verificationStatus: 'verified' }),
      Domain.countDocuments({ ...filter, status: 'active' }),
      Domain.countDocuments({ ...filter, verificationStatus: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalDomains,
          verifiedDomains,
          activeDomains,
          pendingDomains
        }
      }
    });
  } catch (error) {
    console.error('Get domain stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch domain statistics'
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
        setupInstructions: domainService.getSetupInstructions(domain, 'CNAME')
      }
    });
  } catch (error) {
    console.error('Get domain info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch domain information'
    });
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
  getDomainInfo
};