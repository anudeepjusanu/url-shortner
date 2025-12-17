/**
 * Google Analytics Service
 * Fetches analytics data from GA4 using the Data API
 */

const { getClient, getPropertyId, isConfigured } = require('../config/googleAnalytics');

class GoogleAnalyticsService {
  /**
   * Get real-time active users
   */
  async getRealtimeData() {
    if (!isConfigured()) {
      throw new Error('Google Analytics is not configured');
    }

    const client = getClient();
    const propertyId = getPropertyId();

    try {
      const [response] = await client.runRealtimeReport({
        property: propertyId,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }]
      });

      let totalActiveUsers = 0;
      const byCountry = [];

      if (response.rows) {
        response.rows.forEach(row => {
          const country = row.dimensionValues[0].value;
          const users = parseInt(row.metricValues[0].value, 10);
          totalActiveUsers += users;
          byCountry.push({ country, users });
        });
      }

      return {
        activeUsers: totalActiveUsers,
        byCountry: byCountry.sort((a, b) => b.users - a.users).slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching realtime data:', error);
      throw error;
    }
  }

  /**
   * Get overview metrics for a date range
   */
  async getOverview(startDate = '30daysAgo', endDate = 'today') {
    if (!isConfigured()) {
      throw new Error('Google Analytics is not configured');
    }

    const client = getClient();
    const propertyId = getPropertyId();

    try {
      const [response] = await client.runReport({
        property: propertyId,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'engagementRate' }
        ]
      });

      if (response.rows && response.rows.length > 0) {
        const metrics = response.rows[0].metricValues;
        return {
          activeUsers: parseInt(metrics[0].value, 10),
          newUsers: parseInt(metrics[1].value, 10),
          sessions: parseInt(metrics[2].value, 10),
          pageViews: parseInt(metrics[3].value, 10),
          avgSessionDuration: parseFloat(metrics[4].value).toFixed(2),
          bounceRate: (parseFloat(metrics[5].value) * 100).toFixed(2),
          engagementRate: (parseFloat(metrics[6].value) * 100).toFixed(2)
        };
      }

      return {
        activeUsers: 0,
        newUsers: 0,
        sessions: 0,
        pageViews: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        engagementRate: 0
      };
    } catch (error) {
      console.error('Error fetching overview:', error);
      throw error;
    }
  }

  /**
   * Get traffic over time (daily breakdown)
   */
  async getTrafficOverTime(startDate = '30daysAgo', endDate = 'today') {
    if (!isConfigured()) {
      throw new Error('Google Analytics is not configured');
    }

    const client = getClient();
    const propertyId = getPropertyId();

    try {
      const [response] = await client.runReport({
        property: propertyId,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' }
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }]
      });

      const data = [];
      if (response.rows) {
        response.rows.forEach(row => {
          const dateStr = row.dimensionValues[0].value;
          // Format: YYYYMMDD -> YYYY-MM-DD
          const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
          
          data.push({
            date: formattedDate,
            users: parseInt(row.metricValues[0].value, 10),
            sessions: parseInt(row.metricValues[1].value, 10),
            pageViews: parseInt(row.metricValues[2].value, 10)
          });
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching traffic over time:', error);
      throw error;
    }
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(startDate = '30daysAgo', endDate = 'today') {
    if (!isConfigured()) {
      throw new Error('Google Analytics is not configured');
    }

    const client = getClient();
    const propertyId = getPropertyId();

    try {
      const [response] = await client.runReport({
        property: propertyId,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' }
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10
      });

      const sources = [];
      if (response.rows) {
        response.rows.forEach(row => {
          sources.push({
            source: row.dimensionValues[0].value,
            sessions: parseInt(row.metricValues[0].value, 10),
            users: parseInt(row.metricValues[1].value, 10)
          });
        });
      }

      return sources;
    } catch (error) {
      console.error('Error fetching traffic sources:', error);
      throw error;
    }
  }

  /**
   * Get top pages
   */
  async getTopPages(startDate = '30daysAgo', endDate = 'today', limit = 10) {
    if (!isConfigured()) {
      throw new Error('Google Analytics is not configured');
    }

    const client = getClient();
    const propertyId = getPropertyId();

    try {
      const [response] = await client.runReport({
        property: propertyId,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' }
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'averageSessionDuration' }
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit
      });

      const pages = [];
      if (response.rows) {
        response.rows.forEach(row => {
          pages.push({
            path: row.dimensionValues[0].value,
            title: row.dimensionValues[1].value || row.dimensionValues[0].value,
            pageViews: parseInt(row.metricValues[0].value, 10),
            users: parseInt(row.metricValues[1].value, 10),
            avgDuration: parseFloat(row.metricValues[2].value).toFixed(2)
          });
        });
      }

      return pages;
    } catch (error) {
      console.error('Error fetching top pages:', error);
      throw error;
    }
  }

  /**
   * Get geographic data
   */
  async getGeographicData(startDate = '30daysAgo', endDate = 'today') {
    if (!isConfigured()) {
      throw new Error('Google Analytics is not configured');
    }

    const client = getClient();
    const propertyId = getPropertyId();

    try {
      const [response] = await client.runReport({
        property: propertyId,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'country' },
          { name: 'city' }
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' }
        ],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 20
      });

      const locations = [];
      if (response.rows) {
        response.rows.forEach(row => {
          locations.push({
            country: row.dimensionValues[0].value,
            city: row.dimensionValues[1].value,
            users: parseInt(row.metricValues[0].value, 10),
            sessions: parseInt(row.metricValues[1].value, 10)
          });
        });
      }

      return locations;
    } catch (error) {
      console.error('Error fetching geographic data:', error);
      throw error;
    }
  }

  /**
   * Get device breakdown
   */
  async getDeviceData(startDate = '30daysAgo', endDate = 'today') {
    if (!isConfigured()) {
      throw new Error('Google Analytics is not configured');
    }

    const client = getClient();
    const propertyId = getPropertyId();

    try {
      const [response] = await client.runReport({
        property: propertyId,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' }
        ],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
      });

      const devices = [];
      if (response.rows) {
        response.rows.forEach(row => {
          devices.push({
            device: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value, 10),
            sessions: parseInt(row.metricValues[1].value, 10),
            pageViews: parseInt(row.metricValues[2].value, 10)
          });
        });
      }

      return devices;
    } catch (error) {
      console.error('Error fetching device data:', error);
      throw error;
    }
  }

  /**
   * Get browser data
   */
  async getBrowserData(startDate = '30daysAgo', endDate = 'today') {
    if (!isConfigured()) {
      throw new Error('Google Analytics is not configured');
    }

    const client = getClient();
    const propertyId = getPropertyId();

    try {
      const [response] = await client.runReport({
        property: propertyId,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'browser' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10
      });

      const browsers = [];
      if (response.rows) {
        response.rows.forEach(row => {
          browsers.push({
            browser: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value, 10)
          });
        });
      }

      return browsers;
    } catch (error) {
      console.error('Error fetching browser data:', error);
      throw error;
    }
  }

  /**
   * Get all dashboard data in one call
   */
  async getDashboardData(startDate = '30daysAgo', endDate = 'today') {
    try {
      const [
        overview,
        trafficOverTime,
        trafficSources,
        topPages,
        geographic,
        devices,
        browsers
      ] = await Promise.all([
        this.getOverview(startDate, endDate),
        this.getTrafficOverTime(startDate, endDate),
        this.getTrafficSources(startDate, endDate),
        this.getTopPages(startDate, endDate),
        this.getGeographicData(startDate, endDate),
        this.getDeviceData(startDate, endDate),
        this.getBrowserData(startDate, endDate)
      ]);

      return {
        overview,
        trafficOverTime,
        trafficSources,
        topPages,
        geographic,
        devices,
        browsers
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

module.exports = new GoogleAnalyticsService();
