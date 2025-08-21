import { getCountryFromIP } from "../server/utils/geolocation.js";

export default async function handler(req, res) {
  const testIPs = [
    "172.58.148.212", // The IP from login logs showing Unknown
    "8.8.8.8",        // Google DNS - should be US
    "127.0.0.1",      // Localhost
    "192.168.1.1",    // Private network
    "76.123.45.67",   // US IP
  ];

  const results = testIPs.map(ip => ({
    ip: ip,
    country: getCountryFromIP(ip)
  }));

  return res.status(200).json({
    success: true,
    testResults: results,
    message: "Geolocation test completed"
  });
}
