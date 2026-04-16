const BioPage = require('../models/BioPage');

const RESERVED_USERNAMES = [
  'admin', 'api', 'login', 'register', 'blog', 'bio', 'about',
  'contact', 'home', 'dashboard', 'settings', 'profile', 'help',
  'support', 'terms', 'privacy', 'www', 'mail', 'ftp', 'static',
  'assets', 'app', 'auth', 'user', 'users', 'health', 'status',
  'q', 'qr', 'preview',
];

const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const makeError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const bioPageService = {
  async checkUsernameAvailability(username, excludeId = null) {
    const normalized = username.toLowerCase().trim();

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
    const { username, title, description, avatarUrl, theme, links = [], socialLinks } = data;

    if (!username) throw makeError('Username is required', 400);
    if (!title) throw makeError('Title is required', 400);

    const { available, reason } = await this.checkUsernameAvailability(username);
    if (!available) throw makeError(reason || 'Username is already taken', 400);

    for (const link of links) {
      if (!validateUrl(link.url)) {
        throw makeError(`Invalid URL for link "${link.title}": ${link.url}`, 400);
      }
    }

    const bioPage = new BioPage({
      username: username.toLowerCase().trim(),
      title: title.trim(),
      description: description?.trim() || '',
      avatarUrl: avatarUrl || '',
      owner: userId,
      theme: theme || {},
      links: links.map((l, i) => ({ ...l, order: l.order ?? i })),
      socialLinks: socialLinks || {},
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

    if (data.links) {
      for (const link of data.links) {
        if (!validateUrl(link.url)) {
          throw makeError(`Invalid URL for link "${link.title}": ${link.url}`, 400);
        }
      }
      bioPage.links = data.links.map((l, i) => ({ ...l, order: l.order ?? i }));
    }

    const updatableFields = ['title', 'description', 'avatarUrl', 'theme', 'socialLinks', 'isPublished'];
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        bioPage[field] = data[field];
      }
    }

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

    return {
      username: bioPage.username,
      title: bioPage.title,
      description: bioPage.description,
      avatarUrl: bioPage.avatarUrl,
      theme: bioPage.theme,
      links: bioPage.links
        .filter((l) => l.isActive)
        .sort((a, b) => a.order - b.order)
        .map((l) => ({ _id: l._id, title: l.title, url: l.url, icon: l.icon })),
      socialLinks: bioPage.socialLinks,
    };
  },

  async trackLinkClick(username, linkId) {
    const bioPage = await BioPage.findOne({
      username: username.toLowerCase().trim(),
      isActive: true,
    });

    if (!bioPage) throw makeError('Bio page not found', 404);

    const link = bioPage.links.id(linkId);
    if (!link) throw makeError('Link not found', 404);

    link.clickCount = (link.clickCount || 0) + 1;
    await bioPage.save();

    return { url: link.url };
  },

  async getBioPageAnalytics(bioPageId, userId) {
    const bioPage = await BioPage.findOne({ _id: bioPageId, owner: userId, isActive: true });
    if (!bioPage) throw makeError('Bio page not found', 404);

    const totalClicks = bioPage.links.reduce((sum, l) => sum + (l.clickCount || 0), 0);

    return {
      bioPageId: bioPage._id,
      title: bioPage.title,
      username: bioPage.username,
      totalViews: bioPage.totalViews,
      totalClicks,
      links: bioPage.links.map((l) => ({
        _id: l._id,
        title: l.title,
        url: l.url,
        clickCount: l.clickCount || 0,
        clickRate: bioPage.totalViews > 0
          ? ((l.clickCount / bioPage.totalViews) * 100).toFixed(1)
          : '0.0',
      })),
    };
  },
};

module.exports = bioPageService;
