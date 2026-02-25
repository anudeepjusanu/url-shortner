const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');

/**
 * Generate and serve sitemap.xml for SEO
 */
exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || 'https://snip.sa';

    // Define static pages
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/pricing', changefreq: 'weekly', priority: 0.8 },
      { url: '/features', changefreq: 'weekly', priority: 0.8 },
      { url: '/about', changefreq: 'monthly', priority: 0.6 },
      { url: '/contact', changefreq: 'monthly', priority: 0.6 },
      { url: '/privacy', changefreq: 'monthly', priority: 0.5 },
      { url: '/terms', changefreq: 'monthly', priority: 0.5 },
      { url: '/docs', changefreq: 'weekly', priority: 0.7 }
    ];

    // Create a stream to write to
    const stream = new SitemapStream({ hostname: baseUrl });

    // Return a promise that resolves with sitemap
    const sitemap = await streamToPromise(Readable.from(staticPages).pipe(stream));

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(sitemap.toString());
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};
