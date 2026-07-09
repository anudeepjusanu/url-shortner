const UtmLink = require('../models/UtmLink');
const { validateUrl } = require('../utils/urlValidator');

const makeError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// Rebuilds the tagged URL server-side rather than trusting the client's
// version, so the stored fullTaggedUrl always matches destinationUrl + params.
const buildTaggedUrl = (destinationUrl, params) => {
  const url = new URL(destinationUrl);
  const map = {
    utm_source: params.utmSource,
    utm_medium: params.utmMedium,
    utm_campaign: params.utmCampaign,
    utm_term: params.utmTerm,
    utm_content: params.utmContent,
  };
  Object.entries(map).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
};

const utmLinkService = {
  async createUtmLink(userId, organizationId, data) {
    const { name, destinationUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = data;

    if (!destinationUrl) throw makeError('Destination URL is required', 400);

    const urlValidation = validateUrl(destinationUrl);
    if (!urlValidation.isValid) {
      throw makeError(urlValidation.message || 'Invalid destination URL', 400);
    }

    const params = {
      utmSource: utmSource?.trim() || null,
      utmMedium: utmMedium?.trim() || null,
      utmCampaign: utmCampaign?.trim() || null,
      utmTerm: utmTerm?.trim() || null,
      utmContent: utmContent?.trim() || null,
    };

    const utmLink = new UtmLink({
      creator: userId,
      organization: organizationId || null,
      name: name?.trim() || null,
      destinationUrl: urlValidation.cleanUrl,
      ...params,
      fullTaggedUrl: buildTaggedUrl(urlValidation.cleanUrl, params),
    });

    await utmLink.save();
    return utmLink;
  },

  async getUserUtmLinks(userId) {
    return UtmLink.find({ creator: userId }).sort({ createdAt: -1 });
  },

  async deleteUtmLink(id, userId) {
    const utmLink = await UtmLink.findOne({ _id: id, creator: userId });
    if (!utmLink) throw makeError('UTM link not found', 404);
    await utmLink.deleteOne();
  },
};

module.exports = utmLinkService;
