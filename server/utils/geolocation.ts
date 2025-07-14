// Enhanced IP to country mapping with comprehensive ranges and flags

export const getCountryFromIP = (ip: string): string => {
  // Enhanced country detection with comprehensive IP ranges and flags

  // Local and private network detection
  if (ip === "127.0.0.1" || ip === "::1") return "🏠 Localhost";
  if (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    return "🏢 Private Network";
  }

  // United States (major ISP ranges)
  if (
    ip.startsWith("8.8.8.") || // Google DNS
    ip.startsWith("1.1.1.") || // Cloudflare
    ip.startsWith("76.") ||
    ip.startsWith("104.") ||
    ip.startsWith("107.") ||
    ip.startsWith("173.") ||
    ip.startsWith("184.") ||
    ip.startsWith("208.") ||
    ip.startsWith("75.") ||
    ip.startsWith("96.") ||
    ip.startsWith("98.") ||
    ip.startsWith("74.") ||
    ip.startsWith("71.") ||
    ip.startsWith("67.") ||
    ip.startsWith("68.") ||
    ip.startsWith("72.") ||
    ip.startsWith("70.") ||
    ip.startsWith("69.") ||
    ip.startsWith("73.")
  )
    return "🇺🇸 United States";

  // Canada
  if (
    ip.startsWith("24.") ||
    ip.startsWith("99.") ||
    ip.startsWith("142.") ||
    ip.startsWith("216.") ||
    ip.startsWith("206.") ||
    ip.startsWith("207.") ||
    ip.startsWith("64.") ||
    ip.startsWith("65.")
  )
    return "🇨🇦 Canada";

  // United Kingdom
  if (
    ip.startsWith("81.") ||
    ip.startsWith("86.") ||
    ip.startsWith("90.") ||
    ip.startsWith("151.") ||
    ip.startsWith("92.") ||
    ip.startsWith("195.")
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

  return "🌐 Unknown Region";
};
