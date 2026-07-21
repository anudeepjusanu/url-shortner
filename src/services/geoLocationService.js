/**
 * Geolocation Service
 * Uses ip-api.com for IP-based geolocation (free, no API key required)
 */

const logger = require("../config/logger");

/**
 * Check if IP is a private/local IP
 */
const isPrivateIP = (ip) => {
  if (!ip) return true;
  const cleanIP = ip.replace(/^::ffff:/, "");
  return (
    cleanIP === "127.0.0.1" ||
    cleanIP === "::1" ||
    cleanIP === "localhost" ||
    cleanIP.startsWith("192.168.") ||
    cleanIP.startsWith("10.") ||
    cleanIP.startsWith("172.16.") ||
    cleanIP.startsWith("172.17.") ||
    cleanIP.startsWith("172.18.") ||
    cleanIP.startsWith("172.19.") ||
    cleanIP.startsWith("172.2") ||
    cleanIP.startsWith("172.30.") ||
    cleanIP.startsWith("172.31.")
  );
};

/**
 * Get public IP for the server (used when client IP is private/local)
 */
const getPublicIP = async () => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (error) {
    logger.error("Failed to get public IP:", error.message);
  }
  return null;
};

const getLocationFromIP = async (ip) => {
  try {
    logger.info("🌍 Geolocation: Received IP:", ip);

    // Clean IP address (remove ::ffff: prefix for IPv4-mapped IPv6)
    let cleanIP = ip ? ip.replace(/^::ffff:/, "") : null;
    logger.info("🌍 Geolocation: Cleaned IP:", cleanIP);

    // If IP is private/local, try to get the public IP
    if (isPrivateIP(cleanIP)) {
      logger.info("🌍 Geolocation: Private IP detected, fetching public IP...");
      const publicIP = await getPublicIP();
      if (publicIP) {
        logger.info("🌍 Geolocation: Using public IP:", publicIP);
        cleanIP = publicIP;
      } else {
        logger.info(
          "🌍 Geolocation: Could not get public IP, skipping geolocation",
        );
        return null;
      }
    }

    // Use ip-api.com (free tier: 45 requests/minute)
    const apiUrl = `http://ip-api.com/json/${cleanIP}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query`;
    logger.info("🌍 Geolocation: Calling API:", apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      logger.error("🌍 Geolocation: API error:", response.status);
      return null;
    }

    const data = await response.json();
    logger.info("🌍 Geolocation: API response:", data);

    if (data.status === "fail") {
      logger.error("🌍 Geolocation: Lookup failed:", data.message);
      return null;
    }

    const location = {
      ip: data.query || cleanIP,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName || data.region,
      city: data.city,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
    };

    logger.info("🌍 Geolocation: Success:", location);
    return location;
  } catch (error) {
    logger.error("🌍 Geolocation: Service error:", error.message);
    return null;
  }
};

/**
 * Extract client IP from request
 * Handles proxies and load balancers
 */
const getClientIP = (req) => {
  // Check various headers for the real client IP
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ip = forwardedFor.split(",")[0].trim();
    logger.info("🌍 getClientIP: Found x-forwarded-for:", ip);
    return ip;
  }

  const realIP = req.headers["x-real-ip"];
  if (realIP) {
    logger.info("🌍 getClientIP: Found x-real-ip:", realIP);
    return realIP;
  }

  // Fallback to connection remote address
  const fallbackIP =
    req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
  logger.info("🌍 getClientIP: Using fallback IP:", fallbackIP);
  return fallbackIP;
};

module.exports = {
  getLocationFromIP,
  getClientIP,
};
