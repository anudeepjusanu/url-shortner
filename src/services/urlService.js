const axios = require('axios');
const cheerio = require('cheerio');
const Url = require('../models/Url');
const { generateShortCode } = require('../utils/shortCodeGenerator');
const { validateUrl } = require('../utils/urlValidator');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const config = require('../config/environment');

class UrlService {
  async createShortUrl(urlData, userId, organizationId = null) {
    try {
      const {
        originalUrl,
        customCode,
        title,
        description,
        tags,
        expiresAt,
        password,
        utm,
        restrictions,
        redirectType,
        fetchMetadata = true
      } = urlData;
      
      const urlValidation = validateUrl(originalUrl);
      if (!urlValidation.isValid) {
        throw new Error(urlValidation.message);
      }
      
      let shortCode = customCode;
      
      if (customCode) {
        const existingUrl = await Url.findOne({
          $or: [{ shortCode: customCode }, { customCode: customCode }]
        });
        
        if (existingUrl) {
          throw new Error('Custom code already exists');
        }
      } else {
        shortCode = await this.generateUniqueShortCode();
      }
      
      let metadata = {};
      if (fetchMetadata) {
        metadata = await this.fetchUrlMetadata(urlValidation.cleanUrl);
      }
      
      const url = new Url({
        originalUrl: urlValidation.cleanUrl,
        shortCode,
        customCode,
        title: title || metadata.title || urlValidation.title,
        description: description || metadata.description,
        creator: userId,
        organization: organizationId,
        tags: tags ? tags.map(tag => tag.toLowerCase().trim()) : [],
        expiresAt,
        password,
        utm: utm || {},
        restrictions: restrictions || {},
        redirectType: redirectType || 302,
        metaData: metadata
      });
      
      await url.save();
      
      await cacheSet(`url:${shortCode}`, url, config.CACHE_TTL.URL_CACHE);
      
      return url;
    } catch (error) {
      throw new Error(`Failed to create URL: ${error.message}`);
    }
  }
  
  async generateUniqueShortCode(attempts = 0) {
    if (attempts > 10) {
      throw new Error('Failed to generate unique short code after multiple attempts');
    }
    
    const shortCode = generateShortCode();
    const existingUrl = await Url.findOne({ shortCode });
    
    if (existingUrl) {
      return this.generateUniqueShortCode(attempts + 1);
    }
    
    return shortCode;
  }
  
  async fetchUrlMetadata(url) {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        maxContentLength: 5 * 1024 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URL-Shortener/1.0; +https://example.com/bot)'
        }
      });
      
      if (!response.headers['content-type']?.includes('text/html')) {
        return {};
      }
      
      const $ = cheerio.load(response.data);
      
      const metadata = {
        title: this.extractTitle($),
        description: this.extractDescription($),
        favicon: this.extractFavicon($, url),
        ogTitle: $('meta[property="og:title"]').attr('content'),
        ogDescription: $('meta[property="og:description"]').attr('content'),
        ogImage: $('meta[property="og:image"]').attr('content'),
        ogType: $('meta[property="og:type"]').attr('content')
      };
      
      return this.cleanMetadata(metadata);
    } catch (error) {
      console.log(`Failed to fetch metadata for ${url}:`, error.message);
      return {};
    }
  }
  
  extractTitle($) {
    const title = $('title').text() || 
                  $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('h1').first().text();
    
    return title ? title.trim().substring(0, 200) : null;
  }
  
  extractDescription($) {
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="twitter:description"]').attr('content') ||
                       $('p').first().text();
    
    return description ? description.trim().substring(0, 500) : null;
  }
  
  extractFavicon($, baseUrl) {
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]'
    ];
    
    for (const selector of faviconSelectors) {
      const href = $(selector).attr('href');
      if (href) {
        return href.startsWith('http') ? href : new URL(href, baseUrl).href;
      }
    }
    
    return `${new URL(baseUrl).origin}/favicon.ico`;
  }
  
  cleanMetadata(metadata) {
    const cleaned = {};
    
    Object.keys(metadata).forEach(key => {
      if (metadata[key] && metadata[key].trim) {
        cleaned[key] = metadata[key].trim();
      } else if (metadata[key]) {
        cleaned[key] = metadata[key];
      }
    });
    
    return cleaned;
  }
  
  async getUrlByShortCode(shortCode) {
    try {
      let url = await cacheGet(`url:${shortCode}`);
      
      if (!url) {
        url = await Url.findOne({
          $or: [{ shortCode }, { customCode: shortCode }]
        }).populate('creator', 'firstName lastName email')
          .populate('organization', 'name slug');
        
        if (url) {
          await cacheSet(`url:${shortCode}`, url, config.CACHE_TTL.URL_CACHE);
        }
      }
      
      return url;
    } catch (error) {
      console.error('Error fetching URL by short code:', error);
      return null;
    }
  }
  
  async updateUrl(urlId, updateData, userId) {
    try {
      const url = await Url.findById(urlId);
      
      if (!url) {
        throw new Error('URL not found');
      }
      
      if (url.creator.toString() !== userId) {
        throw new Error('Unauthorized to update this URL');
      }
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          url[key] = updateData[key];
        }
      });
      
      await url.save();
      
      await cacheDel(`url:${url.shortCode}`);
      if (url.customCode) {
        await cacheDel(`url:${url.customCode}`);
      }
      
      return url;
    } catch (error) {
      throw new Error(`Failed to update URL: ${error.message}`);
    }
  }
  
  async deleteUrl(urlId, userId) {
    try {
      const url = await Url.findById(urlId);
      
      if (!url) {
        throw new Error('URL not found');
      }
      
      if (url.creator.toString() !== userId) {
        throw new Error('Unauthorized to delete this URL');
      }
      
      await Url.findByIdAndDelete(urlId);
      
      await cacheDel(`url:${url.shortCode}`);
      if (url.customCode) {
        await cacheDel(`url:${url.customCode}`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Failed to delete URL: ${error.message}`);
    }
  }
  
  async bulkCreateUrls(urlsData, userId, organizationId = null) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < urlsData.length; i++) {
      try {
        const url = await this.createShortUrl({
          ...urlsData[i],
          bulkImportId: `bulk_${Date.now()}_${userId}`
        }, userId, organizationId);
        
        results.push({
          index: i,
          success: true,
          url: url
        });
      } catch (error) {
        errors.push({
          index: i,
          success: false,
          error: error.message,
          data: urlsData[i]
        });
      }
    }
    
    return {
      successful: results,
      failed: errors,
      totalProcessed: urlsData.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }
  
  async getUserUrls(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        tags,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isActive,
        organizationId
      } = options;
      
      const skip = (page - 1) * limit;
      const filter = { creator: userId };
      
      if (organizationId) {
        filter.$or = [
          { creator: userId },
          { organization: organizationId }
        ];
      }
      
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { originalUrl: { $regex: search, $options: 'i' } },
          { shortCode: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (tags && tags.length > 0) {
        filter.tags = { $in: tags.map(tag => tag.toLowerCase().trim()) };
      }
      
      if (isActive !== undefined) {
        filter.isActive = isActive;
      }
      
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const [urls, total] = await Promise.all([
        Url.find(filter)
          .populate('creator', 'firstName lastName email')
          .populate('organization', 'name slug')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        Url.countDocuments(filter)
      ]);
      
      return {
        urls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch user URLs: ${error.message}`);
    }
  }
  
  async getUrlStats(userId, organizationId = null) {
    try {
      const filter = { creator: userId };
      
      if (organizationId) {
        filter.$or = [
          { creator: userId },
          { organization: organizationId }
        ];
      }
      
      const [
        totalUrls,
        activeUrls,
        totalClicks,
        uniqueClicks,
        topUrls
      ] = await Promise.all([
        Url.countDocuments(filter),
        Url.countDocuments({ ...filter, isActive: true }),
        Url.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$clickCount' } } }
        ]),
        Url.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$uniqueClickCount' } } }
        ]),
        Url.find(filter)
          .sort({ clickCount: -1 })
          .limit(5)
          .select('title originalUrl shortCode clickCount createdAt')
      ]);
      
      return {
        totalUrls,
        activeUrls,
        totalClicks: totalClicks[0]?.total || 0,
        uniqueClicks: uniqueClicks[0]?.total || 0,
        topUrls
      };
    } catch (error) {
      throw new Error(`Failed to fetch URL stats: ${error.message}`);
    }
  }
}

module.exports = new UrlService();