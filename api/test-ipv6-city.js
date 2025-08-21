import { getCityFromIP, getCountryFromIP } from "../server/utils/geolocation.js";

export default async function handler(req, res) {
  const testIPs = [
    "2607:fb90:2328:f564:c8e7:a4ee:c66b:9a81", // Your actual IPv6 address
    "2607:fb90:1234:5678:abcd:ef01:2345:6789", // Another 2607:fb90 range
    "2607:f8b0:4000:801::200e",                // Google IPv6
    "2001:4860:4860::8888",                    // Google DNS IPv6
    "2600:1700:1234:5678:abcd:ef01:2345:6789", // US ISP IPv6
    "::1",                                     // IPv6 localhost
  ];

  const results = testIPs.map(ip => ({
    ip: ip,
    country: getCountryFromIP(ip),
    city: getCityFromIP(ip)
  }));

  return res.status(200).json({
    success: true,
    testResults: results,
    message: "IPv6 city detection test completed"
  });
}
