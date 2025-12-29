const { getLocationFromIP, getClientIP } = require('../../services/geoLocationService');

// Mock fetch globally
global.fetch = jest.fn();

describe('GeoLocation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console mocks
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('getLocationFromIP', () => {
    test('should return location data for valid public IP', async () => {
      const mockResponse = {
        status: 'success',
        country: 'Saudi Arabia',
        countryCode: 'SA',
        region: 'RD',
        regionName: 'Riyadh',
        city: 'Riyadh',
        lat: 24.7136,
        lon: 46.6753,
        timezone: 'Asia/Riyadh',
        query: '185.100.50.100'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getLocationFromIP('185.100.50.100');

      expect(result).toEqual({
        ip: '185.100.50.100',
        country: 'Saudi Arabia',
        countryCode: 'SA',
        region: 'Riyadh',
        city: 'Riyadh',
        latitude: 24.7136,
        longitude: 46.6753,
        timezone: 'Asia/Riyadh'
      });
    });

    test('should handle private IP by fetching public IP', async () => {
      // Mock public IP fetch
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '8.8.8.8' })
        })
        // Mock geolocation fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            country: 'United States',
            countryCode: 'US',
            region: 'CA',
            regionName: 'California',
            city: 'Mountain View',
            lat: 37.4056,
            lon: -122.0775,
            timezone: 'America/Los_Angeles',
            query: '8.8.8.8'
          })
        });

      const result = await getLocationFromIP('192.168.1.1');

      expect(result).toBeDefined();
      expect(result.country).toBe('United States');
    });

    test('should handle localhost IP', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '8.8.8.8' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            country: 'United States',
            countryCode: 'US',
            query: '8.8.8.8'
          })
        });

      const result = await getLocationFromIP('127.0.0.1');
      expect(result).toBeDefined();
    });

    test('should handle IPv6 localhost', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '8.8.8.8' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            country: 'United States',
            countryCode: 'US',
            query: '8.8.8.8'
          })
        });

      const result = await getLocationFromIP('::1');
      expect(result).toBeDefined();
    });

    test('should clean IPv4-mapped IPv6 addresses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          country: 'Saudi Arabia',
          countryCode: 'SA',
          query: '185.100.50.100'
        })
      });

      const result = await getLocationFromIP('::ffff:185.100.50.100');
      expect(result).toBeDefined();
      expect(result.ip).toBe('185.100.50.100');
    });

    test('should return null for failed API response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await getLocationFromIP('8.8.8.8');
      expect(result).toBeNull();
    });

    test('should return null for failed geolocation lookup', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'fail',
          message: 'invalid query'
        })
      });

      const result = await getLocationFromIP('invalid-ip');
      expect(result).toBeNull();
    });

    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getLocationFromIP('8.8.8.8');
      expect(result).toBeNull();
    });

    test('should handle null IP', async () => {
      const result = await getLocationFromIP(null);
      expect(result).toBeNull();
    });

    test('should handle undefined IP', async () => {
      const result = await getLocationFromIP(undefined);
      expect(result).toBeNull();
    });

    test('should handle empty string IP', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '8.8.8.8' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            country: 'United States',
            query: '8.8.8.8'
          })
        });

      const result = await getLocationFromIP('');
      expect(result).toBeDefined();
    });

    test('should handle 10.x.x.x private network', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '8.8.8.8' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            country: 'United States',
            query: '8.8.8.8'
          })
        });

      const result = await getLocationFromIP('10.0.0.1');
      expect(result).toBeDefined();
    });

    test('should handle 172.16.x.x to 172.31.x.x private network', async () => {
      const privateIPs = ['172.16.0.1', '172.20.0.1', '172.31.255.255'];

      for (const ip of privateIPs) {
        fetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ip: '8.8.8.8' })
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              status: 'success',
              country: 'United States',
              query: '8.8.8.8'
            })
          });

        const result = await getLocationFromIP(ip);
        expect(result).toBeDefined();
      }
    });

    test('should return null when public IP fetch fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Failed to get public IP'));

      const result = await getLocationFromIP('192.168.1.1');
      expect(result).toBeNull();
    });

    test('should handle API response with missing optional fields', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          country: 'Saudi Arabia',
          countryCode: 'SA',
          query: '185.100.50.100'
        })
      });

      const result = await getLocationFromIP('185.100.50.100');
      expect(result).toEqual({
        ip: '185.100.50.100',
        country: 'Saudi Arabia',
        countryCode: 'SA',
        region: undefined,
        city: undefined,
        latitude: undefined,
        longitude: undefined,
        timezone: undefined
      });
    });
  });

  describe('getClientIP', () => {
    test('should extract IP from x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('203.0.113.195');
    });

    test('should extract IP from x-real-ip header', () => {
      const req = {
        headers: {
          'x-real-ip': '203.0.113.195'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('203.0.113.195');
    });

    test('should prioritize x-forwarded-for over x-real-ip', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195',
          'x-real-ip': '70.41.3.18'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('203.0.113.195');
    });

    test('should fallback to connection.remoteAddress', () => {
      const req = {
        headers: {},
        connection: {
          remoteAddress: '203.0.113.195'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('203.0.113.195');
    });

    test('should fallback to socket.remoteAddress', () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: '203.0.113.195'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('203.0.113.195');
    });

    test('should fallback to req.ip', () => {
      const req = {
        headers: {},
        ip: '203.0.113.195'
      };

      const result = getClientIP(req);
      expect(result).toBe('203.0.113.195');
    });

    test('should handle x-forwarded-for with single IP', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('203.0.113.195');
    });

    test('should trim whitespace from x-forwarded-for', () => {
      const req = {
        headers: {
          'x-forwarded-for': '  203.0.113.195  , 70.41.3.18'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('203.0.113.195');
    });

    test('should handle empty headers object', () => {
      const req = {
        headers: {},
        connection: {
          remoteAddress: '203.0.113.195'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('203.0.113.195');
    });

    test('should handle IPv6 address', () => {
      const req = {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    test('should handle IPv4-mapped IPv6 address', () => {
      const req = {
        headers: {
          'x-forwarded-for': '::ffff:203.0.113.195'
        }
      };

      const result = getClientIP(req);
      expect(result).toBe('::ffff:203.0.113.195');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete flow for public IP', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          country: 'Saudi Arabia',
          countryCode: 'SA',
          region: 'RD',
          regionName: 'Riyadh',
          city: 'Riyadh',
          lat: 24.7136,
          lon: 46.6753,
          timezone: 'Asia/Riyadh',
          query: '185.100.50.100'
        })
      });

      const req = {
        headers: {
          'x-forwarded-for': '185.100.50.100'
        }
      };

      const ip = getClientIP(req);
      const location = await getLocationFromIP(ip);

      expect(location).toBeDefined();
      expect(location.country).toBe('Saudi Arabia');
      expect(location.countryCode).toBe('SA');
    });

    test('should handle complete flow for private IP', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '8.8.8.8' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            country: 'United States',
            countryCode: 'US',
            query: '8.8.8.8'
          })
        });

      const req = {
        headers: {},
        connection: {
          remoteAddress: '192.168.1.100'
        }
      };

      const ip = getClientIP(req);
      const location = await getLocationFromIP(ip);

      expect(location).toBeDefined();
      expect(location.country).toBe('United States');
    });
  });
});