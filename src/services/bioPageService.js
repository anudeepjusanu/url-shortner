const BioPage = require('../models/BioPage');

const RESERVED_USERNAMES = [
  'admin', 'api', 'login', 'register', 'blog', 'bio', 'about',
  'contact', 'home', 'dashboard', 'settings', 'profile', 'help',
  'support', 'terms', 'privacy', 'www', 'mail', 'ftp', 'static',
  'assets', 'app', 'auth', 'user', 'users', 'health', 'status',
  'q', 'qr', 'preview', '4r', 'test',
];

const makeError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const bioPageService = {
  async checkUsernameAvailability(username, excludeId = null) {
    const normalized = username.toLowerCase().trim();

    if (normalized.length < 3) {
      return { available: false, reason: 'Username must be at least 3 characters' };
    }

    if (RESERVED_USERNAMES.includes(normalized)) {
      return { available: false, reason: 'This username is reserved' };
    }

    const query = { username: normalized };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await BioPage.findOne(query);
    return { available: !existing };
  },

  async createBioPage(userId, data) {
    const { username, title, description, avatarUrl, blocks, design, bioTheme, isPublished } = data;

    if (!username) throw makeError('Username is required', 400);
    if (!title) throw makeError('Title is required', 400);

    const { available, reason } = await this.checkUsernameAvailability(username);
    if (!available) throw makeError(reason || 'Username is already taken', 400);

    const bioPage = new BioPage({
      username: username.toLowerCase().trim(),
      title: title.trim(),
      description: description?.trim() || '',
      avatarUrl: avatarUrl || '',
      owner: userId,
      blocks: blocks || [],
      design: design || null,
      bioTheme: bioTheme || null,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    await bioPage.save();
    return bioPage;
  },

  async getUserBioPages(userId) {
    return BioPage.find({ owner: userId, isActive: true })
      .select('-__v')
      .sort({ createdAt: -1 });
  },

  async getBioPageById(bioPageId, userId) {
    const bioPage = await BioPage.findOne({ _id: bioPageId, owner: userId, isActive: true });
    if (!bioPage) throw makeError('Bio page not found', 404);
    return bioPage;
  },

  async updateBioPage(bioPageId, userId, data) {
    const bioPage = await BioPage.findOne({ _id: bioPageId, owner: userId, isActive: true });
    if (!bioPage) throw makeError('Bio page not found', 404);

    if (data.username && data.username.toLowerCase() !== bioPage.username) {
      const { available, reason } = await this.checkUsernameAvailability(data.username, bioPageId);
      if (!available) throw makeError(reason || 'Username is already taken', 400);
      bioPage.username = data.username.toLowerCase().trim();
    }

    const updatableFields = ['title', 'description', 'avatarUrl', 'blocks', 'design', 'bioTheme', 'isPublished'];
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        bioPage[field] = data[field];
      }
    }

    // Mark mixed fields as modified so Mongoose detects the change
    bioPage.markModified('blocks');
    bioPage.markModified('design');
    bioPage.markModified('bioTheme');

    await bioPage.save();
    return bioPage;
  },

  async deleteBioPage(bioPageId, userId) {
    const bioPage = await BioPage.findOne({ _id: bioPageId, owner: userId, isActive: true });
    if (!bioPage) throw makeError('Bio page not found', 404);

    bioPage.isActive = false;
    await bioPage.save();
    return { success: true };
  },

  async getPublicBioPage(username) {
    const bioPage = await BioPage.findOne({
      username: username.toLowerCase().trim(),
      isActive: true,
      isPublished: true,
    });

    if (!bioPage) throw makeError('Bio page not found', 404);

    // Increment view count asynchronously
    BioPage.findByIdAndUpdate(bioPage._id, { $inc: { totalViews: 1 } })
      .exec()
      .catch(() => {});

    // Build response with block click counts merged in
    const blockClickCounts = bioPage.blockClickCounts
      ? Object.fromEntries(bioPage.blockClickCounts)
      : {};

    return {
      _id: bioPage._id,
      username: bioPage.username,
      title: bioPage.title,
      description: bioPage.description,
      avatarUrl: bioPage.avatarUrl,
      blocks: bioPage.blocks || [],
      bioTheme: bioPage.bioTheme || null,
      design: bioPage.design || null,
      blockClickCounts,
      totalViews: bioPage.totalViews,
    };
  },

  async trackLinkClick(username, blockId) {
    const bioPage = await BioPage.findOne({
      username: username.toLowerCase().trim(),
      isActive: true,
    });

    if (!bioPage) throw makeError('Bio page not found', 404);

    const countKey = `blockClickCounts.${blockId}`;
    await BioPage.findByIdAndUpdate(
      bioPage._id,
      { $inc: { [countKey]: 1 } },
    );

    // Try to find the URL from blocks for the given blockId
    let url = null;
    if (bioPage.blocks && Array.isArray(bioPage.blocks)) {
      const block = bioPage.blocks.find((b) => b.id === blockId);
      if (block && block.data && block.data.url) {
        url = block.data.url;
      }
    }

    return { url };
  },

  async getBioPageAnalytics(bioPageId, userId) {
    const bioPage = await BioPage.findOne({ _id: bioPageId, owner: userId, isActive: true });
    if (!bioPage) throw makeError('Bio page not found', 404);

    const blockClickCounts = bioPage.blockClickCounts
      ? Object.fromEntries(bioPage.blockClickCounts)
      : {};

    const totalClicks = Object.values(blockClickCounts).reduce((s, c) => s + (c || 0), 0);

    // Build per-link analytics from link blocks
    const linkAnalytics = [];
    if (bioPage.blocks && Array.isArray(bioPage.blocks)) {
      for (const block of bioPage.blocks) {
        if (block.type === 'link' && block.visible) {
          const clicks = blockClickCounts[block.id] || 0;
          linkAnalytics.push({
            blockId: block.id,
            title: block.data?.titleEn || block.data?.title || 'Link',
            url: block.data?.url || '',
            clickCount: clicks,
            clickRate: bioPage.totalViews > 0
              ? ((clicks / bioPage.totalViews) * 100).toFixed(1)
              : '0.0',
          });
        }
      }
    }

    return {
      bioPageId: bioPage._id,
      title: bioPage.title,
      username: bioPage.username,
      totalViews: bioPage.totalViews,
      totalClicks,
      links: linkAnalytics,
    };
  },
};

module.exports = bioPageService;
