// Enhanced IP to country mapping with comprehensive ranges and flags

export const getCountryFromIP = (ip: string): string => {
  // Clean up IP address and handle edge cases
  if (!ip || ip === "unknown" || ip === "undefined") return "🌐 Unknown Region";

  // Handle IPv6-mapped IPv4 addresses
  let cleanIP = ip.trim();
  if (cleanIP.startsWith("::ffff:")) {
    cleanIP = cleanIP.substring(7);
  }

  // Remove port numbers if present
  if (cleanIP.includes(":") && !cleanIP.includes("::")) {
    cleanIP = cleanIP.split(":")[0];
  }

  console.log(`[GEO] Detecting country for IP: ${ip} -> cleaned: ${cleanIP}`);

  // Local and private network detection
  if (cleanIP === "127.0.0.1" || cleanIP === "::1" || cleanIP === "localhost")
    return "🏠 Localhost";
  if (
    cleanIP.startsWith("192.168.") ||
    cleanIP.startsWith("10.") ||
    cleanIP.startsWith("172.16.") ||
    cleanIP.startsWith("172.17.") ||
    cleanIP.startsWith("172.18.") ||
    cleanIP.startsWith("172.19.") ||
    cleanIP.startsWith("172.20.") ||
    cleanIP.startsWith("172.21.") ||
    cleanIP.startsWith("172.22.") ||
    cleanIP.startsWith("172.23.") ||
    cleanIP.startsWith("172.24.") ||
    cleanIP.startsWith("172.25.") ||
    cleanIP.startsWith("172.26.") ||
    cleanIP.startsWith("172.27.") ||
    cleanIP.startsWith("172.28.") ||
    cleanIP.startsWith("172.29.") ||
    cleanIP.startsWith("172.30.") ||
    cleanIP.startsWith("172.31.")
  ) {
    return "🏢 Private Network";
  }

  // United States (expanded ISP ranges)
  if (
    cleanIP.startsWith("8.8.8.") || // Google DNS
    cleanIP.startsWith("8.8.4.") || // Google DNS
    cleanIP.startsWith("1.1.1.") || // Cloudflare
    cleanIP.startsWith("1.0.0.") || // Cloudflare
    cleanIP.startsWith("4.2.2.") || // Level3 DNS
    cleanIP.startsWith("76.") ||
    cleanIP.startsWith("104.") ||
    cleanIP.startsWith("107.") ||
    cleanIP.startsWith("173.") ||
    cleanIP.startsWith("184.") ||
    cleanIP.startsWith("208.") ||
    cleanIP.startsWith("75.") ||
    cleanIP.startsWith("96.") ||
    cleanIP.startsWith("98.") ||
    cleanIP.startsWith("74.") ||
    cleanIP.startsWith("71.") ||
    cleanIP.startsWith("67.") ||
    cleanIP.startsWith("68.") ||
    cleanIP.startsWith("72.") ||
    cleanIP.startsWith("70.") ||
    cleanIP.startsWith("69.") ||
    cleanIP.startsWith("73.") ||
    cleanIP.startsWith("50.") ||
    cleanIP.startsWith("66.") ||
    cleanIP.startsWith("199.") ||
    cleanIP.startsWith("209.") ||
    cleanIP.startsWith("154.") ||
    cleanIP.startsWith("38.") ||
    cleanIP.startsWith("45.") ||
    cleanIP.startsWith("47.") ||
    cleanIP.startsWith("52.") ||
    cleanIP.startsWith("54.") ||
    cleanIP.startsWith("23.") ||
    cleanIP.startsWith("35.") ||
    cleanIP.startsWith("44.") ||
    cleanIP.startsWith("3.") // AWS range
  )
    return "🇺🇸 United States";

  // Canada (expanded ranges)
  if (
    cleanIP.startsWith("24.") ||
    cleanIP.startsWith("99.") ||
    cleanIP.startsWith("142.") ||
    cleanIP.startsWith("216.") ||
    cleanIP.startsWith("206.") ||
    cleanIP.startsWith("207.") ||
    cleanIP.startsWith("64.") ||
    cleanIP.startsWith("65.") ||
    cleanIP.startsWith("198.") ||
    cleanIP.startsWith("205.") ||
    cleanIP.startsWith("204.") ||
    cleanIP.startsWith("192.197.") ||
    cleanIP.startsWith("129.")
  )
    return "🇨🇦 Canada";

  // United Kingdom (expanded ranges)
  if (
    cleanIP.startsWith("81.") ||
    cleanIP.startsWith("86.") ||
    cleanIP.startsWith("90.") ||
    cleanIP.startsWith("151.") ||
    cleanIP.startsWith("92.") ||
    cleanIP.startsWith("195.") ||
    cleanIP.startsWith("82.") ||
    cleanIP.startsWith("2.")
  )
    return "🇬🇧 United Kingdom";

  // Germany
  if (
    ip.startsWith("46.") ||
    ip.startsWith("78.") ||
    ip.startsWith("85.") ||
    ip.startsWith("91.")
  )
    return "🇩🇪 Germany";

  // France
  if (
    ip.startsWith("80.") ||
    ip.startsWith("82.") ||
    ip.startsWith("88.") ||
    ip.startsWith("109.")
  )
    return "🇫🇷 France";

  // Japan
  if (
    ip.startsWith("27.") ||
    ip.startsWith("110.") ||
    ip.startsWith("126.") ||
    ip.startsWith("133.") ||
    ip.startsWith("210.") ||
    ip.startsWith("218.")
  )
    return "🇯🇵 Japan";

  // Australia
  if (
    ip.startsWith("203.") ||
    ip.startsWith("101.") ||
    ip.startsWith("103.") ||
    ip.startsWith("1.") ||
    ip.startsWith("14.") ||
    ip.startsWith("150.")
  )
    return "🇦🇺 Australia";

  // China
  if (
    ip.startsWith("36.") ||
    ip.startsWith("58.") ||
    ip.startsWith("118.") ||
    ip.startsWith("120.") ||
    ip.startsWith("122.") ||
    ip.startsWith("123.") ||
    ip.startsWith("124.") ||
    ip.startsWith("125.") ||
    ip.startsWith("111.")
  )
    return "🇨🇳 China";

  // India
  if (
    ip.startsWith("49.") ||
    ip.startsWith("117.") ||
    ip.startsWith("182.") ||
    ip.startsWith("106.") ||
    ip.startsWith("59.") ||
    ip.startsWith("115.")
  )
    return "🇮🇳 India";

  // Brazil
  if (
    ip.startsWith("177.") ||
    ip.startsWith("189.") ||
    ip.startsWith("200.") ||
    ip.startsWith("201.") ||
    ip.startsWith("187.") ||
    ip.startsWith("186.")
  )
    return "🇧🇷 Brazil";

  // Russia
  if (
    ip.startsWith("5.") ||
    ip.startsWith("37.") ||
    ip.startsWith("95.") ||
    ip.startsWith("31.") ||
    ip.startsWith("93.") ||
    ip.startsWith("178.")
  )
    return "🇷🇺 Russia";

  // Netherlands
  if (ip.startsWith("83.") || ip.startsWith("84.") || ip.startsWith("77."))
    return "🇳🇱 Netherlands";

  // Spain
  if (ip.startsWith("87.") || ip.startsWith("213.") || ip.startsWith("84."))
    return "🇪🇸 Spain";

  // Italy
  if (ip.startsWith("89.") || ip.startsWith("93.") || ip.startsWith("79."))
    return "🇮🇹 Italy";

  // South Korea
  if (ip.startsWith("121.") || ip.startsWith("211.") || ip.startsWith("175."))
    return "🇰🇷 South Korea";

  // Mexico
  if (ip.startsWith("201.") || ip.startsWith("187.") || ip.startsWith("189."))
    return "🇲🇽 Mexico";

  // Argentina
  if (ip.startsWith("190.") || ip.startsWith("181.")) return "🇦🇷 Argentina";

  // South Africa
  if (ip.startsWith("196.") || ip.startsWith("197.")) return "🇿🇦 South Africa";

  // Thailand
  if (ip.startsWith("183.") || ip.startsWith("202.")) return "🇹🇭 Thailand";

  // Singapore
  if (ip.startsWith("103.") || ip.startsWith("175.")) return "🇸🇬 Singapore";

  // European Union (general ranges)
  if (
    ip.startsWith("185.") ||
    ip.startsWith("194.") ||
    ip.startsWith("212.") ||
    ip.startsWith("217.")
  )
    return "🇪🇺 Europe";

  // African ranges (general)
  if (ip.startsWith("41.") || ip.startsWith("102.") || ip.startsWith("105."))
    return "🌍 Africa";

  // Asian ranges (general)
  if (
    ip.startsWith("220.") ||
    ip.startsWith("219.") ||
    ip.startsWith("202.") ||
    ip.startsWith("222.")
  )
    return "🌏 Asia";

  // South American ranges (general)
  if (ip.startsWith("191.") || ip.startsWith("170.")) return "🌎 South America";

  // Log unmatched IPs for debugging
  console.log(`[GEO] No match found for IP: ${cleanIP}`);

  return "🌐 Unknown Region";
};
