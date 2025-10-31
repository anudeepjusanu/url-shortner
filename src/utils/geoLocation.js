const geoip = require('geoip-lite');

class GeoLocationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000;
    this.countryCodes = {
      'SA': 'Saudi Arabia',
      'AE': 'United Arab Emirates',
      'KW': 'Kuwait',
      'QA': 'Qatar',
      'BH': 'Bahrain',
      'OM': 'Oman',
      'JO': 'Jordan',
      'LB': 'Lebanon',
      'EG': 'Egypt',
      'MA': 'Morocco',
      'DZ': 'Algeria',
      'TN': 'Tunisia',
      'LY': 'Libya',
      'SD': 'Sudan',
      'IQ': 'Iraq',
      'SY': 'Syria',
      'YE': 'Yemen',
      'PS': 'Palestine'
    };
  }
  
  getLocationFromIP(ipAddress) {
    try {
      if (!ipAddress || !this.isValidIP(ipAddress)) {
        return this.getDefaultLocation();
      }
      
      if (this.isPrivateIP(ipAddress) || ipAddress === '127.0.0.1') {
        return this.getDefaultLocation();
      }
      
      const cacheKey = ipAddress;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }
      
      const geo = geoip.lookup(ipAddress);
      
      if (!geo) {
        const defaultLocation = this.getDefaultLocation();
        this.cache.set(cacheKey, {
          data: defaultLocation,
          timestamp: Date.now()
        });
        return defaultLocation;
      }
      
      const location = {
        country: geo.country,
        countryName: this.countryCodes[geo.country] || geo.country,
        region: geo.region || null,
        city: geo.city || null,
        timezone: geo.timezone || null,
        coordinates: {
          latitude: geo.ll ? geo.ll[0] : null,
          longitude: geo.ll ? geo.ll[1] : null
        },
        isEU: geo.eu || false,
        accuracy: this.calculateAccuracy(geo)
      };
      
      this.cache.set(cacheKey, {
        data: location,
        timestamp: Date.now()
      });
      
      return location;
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return this.getDefaultLocation();
    }
  }
  
  isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
  
  isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00::/,
      /^fe80::/
    ];
    
    return privateRanges.some(range => range.test(ip));
  }
  
  getDefaultLocation() {
    return {
      country: 'SA',
      countryName: 'Saudi Arabia',
      region: null,
      city: null,
      timezone: 'Asia/Riyadh',
      coordinates: {
        latitude: 23.8859,
        longitude: 45.0792
      },
      isEU: false,
      accuracy: 'country'
    };
  }
  
  calculateAccuracy(geo) {
    if (geo.city && geo.region) return 'city';
    if (geo.region) return 'region';
    if (geo.country) return 'country';
    return 'unknown';
  }
  
  getCountryName(countryCode) {
    if (!countryCode) return 'Unknown';
    return this.countryCodes[countryCode.toUpperCase()] || countryCode;
  }
  
  isInRegion(location, region) {
    const regions = {
      'middle_east': ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'IQ', 'SY', 'YE', 'PS'],
      'gcc': ['SA', 'AE', 'KW', 'QA', 'BH', 'OM'],
      'north_africa': ['EG', 'MA', 'DZ', 'TN', 'LY', 'SD'],
      'arab_world': ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'EG', 'MA', 'DZ', 'TN', 'LY', 'SD', 'IQ', 'SY', 'YE', 'PS']
    };
    
    const regionCountries = regions[region.toLowerCase()];
    if (!regionCountries) return false;
    
    return regionCountries.includes(location.country);
  }
  
  calculateDistance(location1, location2) {
    try {
      const lat1 = location1.coordinates.latitude;
      const lon1 = location1.coordinates.longitude;
      const lat2 = location2.coordinates.latitude;
      const lon2 = location2.coordinates.longitude;
      
      if (!lat1 || !lon1 || !lat2 || !lon2) {
        return null;
      }
      
      const R = 6371;
      const dLat = this.toRadians(lat2 - lat1);
      const dLon = this.toRadians(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return Math.round(distance);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return null;
    }
  }
  
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  getTimezoneFromLocation(location) {
    try {
      if (location.timezone) {
        return location.timezone;
      }
      
      const timezoneMap = {
        'SA': 'Asia/Riyadh',
        'AE': 'Asia/Dubai',
        'KW': 'Asia/Kuwait',
        'QA': 'Asia/Qatar',
        'BH': 'Asia/Bahrain',
        'OM': 'Asia/Muscat',
        'JO': 'Asia/Amman',
        'LB': 'Asia/Beirut',
        'EG': 'Africa/Cairo',
        'MA': 'Africa/Casablanca',
        'DZ': 'Africa/Algiers',
        'TN': 'Africa/Tunis',
        'LY': 'Africa/Tripoli',
        'SD': 'Africa/Khartoum',
        'IQ': 'Asia/Baghdad',
        'SY': 'Asia/Damascus',
        'YE': 'Asia/Aden',
        'PS': 'Asia/Gaza'
      };
      
      return timezoneMap[location.country] || 'UTC';
    } catch (error) {
      return 'UTC';
    }
  }
  
  getCurrentTimeInLocation(location) {
    try {
      const timezone = this.getTimezoneFromLocation(location);
      return new Date().toLocaleString('en-US', { timeZone: timezone });
    } catch (error) {
      return new Date().toISOString();
    }
  }
  
  validateLocationRestrictions(userLocation, restrictions) {
    if (!restrictions || !restrictions.countries) {
      return { allowed: true };
    }
    
    const { countries, allowedCountries = true } = restrictions;
    
    if (!countries || countries.length === 0) {
      return { allowed: true };
    }
    
    const isCountryInList = countries.includes(userLocation.country);
    
    if (allowedCountries && !isCountryInList) {
      return {
        allowed: false,
        reason: `Access is restricted to: ${countries.map(c => this.getCountryName(c)).join(', ')}`
      };
    }
    
    if (!allowedCountries && isCountryInList) {
      return {
        allowed: false,
        reason: `Access is blocked from: ${this.getCountryName(userLocation.country)}`
      };
    }
    
    return { allowed: true };
  }
  
  getBulkLocations(ipAddresses) {
    const results = [];
    
    for (const ip of ipAddresses) {
      results.push({
        ip,
        location: this.getLocationFromIP(ip)
      });
    }
    
    return results;
  }
  
  getLocationStats(locations) {
    const stats = {
      total: locations.length,
      countries: {},
      regions: {},
      cities: {},
      timezones: {}
    };
    
    locations.forEach(location => {
      if (location.country) {
        stats.countries[location.country] = (stats.countries[location.country] || 0) + 1;
      }
      
      if (location.region) {
        stats.regions[location.region] = (stats.regions[location.region] || 0) + 1;
      }
      
      if (location.city) {
        stats.cities[location.city] = (stats.cities[location.city] || 0) + 1;
      }
      
      if (location.timezone) {
        stats.timezones[location.timezone] = (stats.timezones[location.timezone] || 0) + 1;
      }
    });
    
    return {
      ...stats,
      topCountries: Object.entries(stats.countries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      topCities: Object.entries(stats.cities)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    };
  }
  
  clearCache() {
    this.cache.clear();
  }
  
  getCacheSize() {
    return this.cache.size;
  }
}

const geoLocationService = new GeoLocationService();

module.exports = {
  getLocationFromIP: geoLocationService.getLocationFromIP.bind(geoLocationService),
  getCountryName: geoLocationService.getCountryName.bind(geoLocationService),
  isInRegion: geoLocationService.isInRegion.bind(geoLocationService),
  calculateDistance: geoLocationService.calculateDistance.bind(geoLocationService),
  getTimezoneFromLocation: geoLocationService.getTimezoneFromLocation.bind(geoLocationService),
  getCurrentTimeInLocation: geoLocationService.getCurrentTimeInLocation.bind(geoLocationService),
  validateLocationRestrictions: geoLocationService.validateLocationRestrictions.bind(geoLocationService),
  getBulkLocations: geoLocationService.getBulkLocations.bind(geoLocationService),
  getLocationStats: geoLocationService.getLocationStats.bind(geoLocationService),
  clearCache: geoLocationService.clearCache.bind(geoLocationService),
  getCacheSize: geoLocationService.getCacheSize.bind(geoLocationService)
};