import { getCityFromIP, getCountryFromIP } from "../server/utils/geolocation.js";

export default async function handler(req, res) {
  const testIPs = [
    "172.58.148.212", // The IP from login logs
    "76.28.2.24",     // Verizon FiOS New York
    "8.8.8.8",        // Google DNS
    "1.1.1.1",        // Cloudflare
    "52.0.1.1",       // AWS US-East-1
    "127.0.0.1",      // Localhost
    "192.168.1.1",    // Private network
  ];

  const results = testIPs.map(ip => ({
    ip: ip,
    country: getCountryFromIP(ip),
    city: getCityFromIP(ip)
  }));

  return res.status(200).json({
    success: true,
    testResults: results,
    message: "City detection test completed"
  });
}
