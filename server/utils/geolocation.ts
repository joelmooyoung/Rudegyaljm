// Comprehensive IP to country mapping with extensive ranges and flags

export const getCountryFromIP = (ip: string): string => {
  // Clean up IP address and handle edge cases
  if (!ip || ip === "unknown" || ip === "undefined" || ip === "null") {
    console.log(`[GEO] Invalid IP: ${ip}`);
    return "🌐 Unknown Region";
  }

  // Handle IPv6-mapped IPv4 addresses and clean up
  let cleanIP = ip.trim();
  if (cleanIP.startsWith("::ffff:")) {
    cleanIP = cleanIP.substring(7);
  }

  // Remove port numbers if present
  if (cleanIP.includes(":") && !cleanIP.includes("::")) {
    cleanIP = cleanIP.split(":")[0];
  }

  console.log(
    `[GEO] Detecting country for IP: "${ip}" -> cleaned: "${cleanIP}"`,
  );

  // Local and private network detection
  if (cleanIP === "127.0.0.1" || cleanIP === "::1" || cleanIP === "localhost") {
    console.log(`[GEO] Localhost detected: ${cleanIP}`);
    return "🏠 Localhost";
  }

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
    console.log(`[GEO] Private network detected: ${cleanIP}`);
    return "🏢 Private Network";
  }

  // United States (comprehensive ISP ranges)
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
    cleanIP.startsWith("52.") || // AWS
    cleanIP.startsWith("54.") || // AWS
    cleanIP.startsWith("23.") ||
    cleanIP.startsWith("35.") ||
    cleanIP.startsWith("44.") ||
    cleanIP.startsWith("3.") || // AWS
    cleanIP.startsWith("18.") || // AWS
    cleanIP.startsWith("13.") || // AWS
    cleanIP.startsWith("100.") ||
    cleanIP.startsWith("162.") ||
    cleanIP.startsWith("63.") ||
    cleanIP.startsWith("166.") ||
    cleanIP.startsWith("24.") ||
    cleanIP.startsWith("97.") ||
    cleanIP.startsWith("174.") ||
    cleanIP.startsWith("108.") ||
    cleanIP.startsWith("12.") ||
    cleanIP.startsWith("207.") ||
    cleanIP.startsWith("167.") ||
    cleanIP.startsWith("159.")
  ) {
    console.log(`[GEO] United States detected: ${cleanIP}`);
    return "🇺🇸 United States";
  }

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
  ) {
    console.log(`[GEO] Canada detected: ${cleanIP}`);
    return "🇨🇦 Canada";
  }

  // United Kingdom (expanded ranges)
  if (
    cleanIP.startsWith("81.") ||
    cleanIP.startsWith("86.") ||
    cleanIP.startsWith("90.") ||
    cleanIP.startsWith("151.") ||
    cleanIP.startsWith("92.") ||
    cleanIP.startsWith("195.") ||
    cleanIP.startsWith("82.") ||
    cleanIP.startsWith("2.") ||
    cleanIP.startsWith("5.") ||
    cleanIP.startsWith("31.") ||
    cleanIP.startsWith("79.") ||
    cleanIP.startsWith("87.") ||
    cleanIP.startsWith("94.")
  ) {
    console.log(`[GEO] United Kingdom detected: ${cleanIP}`);
    return "🇬🇧 United Kingdom";
  }

  // Germany
  if (
    cleanIP.startsWith("46.") ||
    cleanIP.startsWith("78.") ||
    cleanIP.startsWith("85.") ||
    cleanIP.startsWith("91.") ||
    cleanIP.startsWith("84.") ||
    cleanIP.startsWith("89.") ||
    cleanIP.startsWith("93.")
  ) {
    console.log(`[GEO] Germany detected: ${cleanIP}`);
    return "🇩🇪 Germany";
  }

  // France
  if (
    cleanIP.startsWith("80.") ||
    cleanIP.startsWith("82.") ||
    cleanIP.startsWith("88.") ||
    cleanIP.startsWith("109.") ||
    cleanIP.startsWith("90.") ||
    cleanIP.startsWith("77.")
  ) {
    console.log(`[GEO] France detected: ${cleanIP}`);
    return "🇫🇷 France";
  }

  // Japan
  if (
    cleanIP.startsWith("27.") ||
    cleanIP.startsWith("110.") ||
    cleanIP.startsWith("126.") ||
    cleanIP.startsWith("133.") ||
    cleanIP.startsWith("210.") ||
    cleanIP.startsWith("218.") ||
    cleanIP.startsWith("61.") ||
    cleanIP.startsWith("180.") ||
    cleanIP.startsWith("163.")
  ) {
    console.log(`[GEO] Japan detected: ${cleanIP}`);
    return "🇯🇵 Japan";
  }

  // Australia
  if (
    cleanIP.startsWith("203.") ||
    cleanIP.startsWith("101.") ||
    cleanIP.startsWith("103.") ||
    cleanIP.startsWith("1.") ||
    cleanIP.startsWith("14.") ||
    cleanIP.startsWith("150.") ||
    cleanIP.startsWith("58.") ||
    cleanIP.startsWith("49.") ||
    cleanIP.startsWith("139.")
  ) {
    console.log(`[GEO] Australia detected: ${cleanIP}`);
    return "🇦🇺 Australia";
  }

  // China
  if (
    cleanIP.startsWith("36.") ||
    cleanIP.startsWith("58.") ||
    cleanIP.startsWith("118.") ||
    cleanIP.startsWith("120.") ||
    cleanIP.startsWith("122.") ||
    cleanIP.startsWith("123.") ||
    cleanIP.startsWith("124.") ||
    cleanIP.startsWith("125.") ||
    cleanIP.startsWith("111.") ||
    cleanIP.startsWith("116.") ||
    cleanIP.startsWith("119.") ||
    cleanIP.startsWith("121.") ||
    cleanIP.startsWith("114.")
  ) {
    console.log(`[GEO] China detected: ${cleanIP}`);
    return "🇨🇳 China";
  }

  // India
  if (
    cleanIP.startsWith("49.") ||
    cleanIP.startsWith("117.") ||
    cleanIP.startsWith("182.") ||
    cleanIP.startsWith("106.") ||
    cleanIP.startsWith("59.") ||
    cleanIP.startsWith("115.") ||
    cleanIP.startsWith("14.") ||
    cleanIP.startsWith("103.") ||
    cleanIP.startsWith("157.")
  ) {
    console.log(`[GEO] India detected: ${cleanIP}`);
    return "🇮🇳 India";
  }

  // Brazil
  if (
    cleanIP.startsWith("177.") ||
    cleanIP.startsWith("189.") ||
    cleanIP.startsWith("200.") ||
    cleanIP.startsWith("201.") ||
    cleanIP.startsWith("187.") ||
    cleanIP.startsWith("186.") ||
    cleanIP.startsWith("179.") ||
    cleanIP.startsWith("191.")
  ) {
    console.log(`[GEO] Brazil detected: ${cleanIP}`);
    return "🇧🇷 Brazil";
  }

  // Russia
  if (
    cleanIP.startsWith("5.") ||
    cleanIP.startsWith("37.") ||
    cleanIP.startsWith("95.") ||
    cleanIP.startsWith("31.") ||
    cleanIP.startsWith("93.") ||
    cleanIP.startsWith("178.") ||
    cleanIP.startsWith("46.") ||
    cleanIP.startsWith("62.")
  ) {
    console.log(`[GEO] Russia detected: ${cleanIP}`);
    return "🇷🇺 Russia";
  }

  // Netherlands
  if (
    cleanIP.startsWith("83.") ||
    cleanIP.startsWith("84.") ||
    cleanIP.startsWith("77.") ||
    cleanIP.startsWith("145.") ||
    cleanIP.startsWith("213.")
  ) {
    console.log(`[GEO] Netherlands detected: ${cleanIP}`);
    return "🇳🇱 Netherlands";
  }

  // Spain
  if (
    cleanIP.startsWith("87.") ||
    cleanIP.startsWith("213.") ||
    cleanIP.startsWith("84.") ||
    cleanIP.startsWith("88.") ||
    cleanIP.startsWith("80.")
  ) {
    console.log(`[GEO] Spain detected: ${cleanIP}`);
    return "🇪🇸 Spain";
  }

  // Italy
  if (
    cleanIP.startsWith("89.") ||
    cleanIP.startsWith("93.") ||
    cleanIP.startsWith("79.") ||
    cleanIP.startsWith("95.") ||
    cleanIP.startsWith("151.")
  ) {
    console.log(`[GEO] Italy detected: ${cleanIP}`);
    return "🇮🇹 Italy";
  }

  // South Korea
  if (
    cleanIP.startsWith("121.") ||
    cleanIP.startsWith("211.") ||
    cleanIP.startsWith("175.") ||
    cleanIP.startsWith("112.") ||
    cleanIP.startsWith("220.")
  ) {
    console.log(`[GEO] South Korea detected: ${cleanIP}`);
    return "🇰🇷 South Korea";
  }

  // Mexico
  if (
    cleanIP.startsWith("201.") ||
    cleanIP.startsWith("187.") ||
    cleanIP.startsWith("189.") ||
    cleanIP.startsWith("200.")
  ) {
    console.log(`[GEO] Mexico detected: ${cleanIP}`);
    return "🇲🇽 Mexico";
  }

  // Argentina
  if (cleanIP.startsWith("190.") || cleanIP.startsWith("181.")) {
    console.log(`[GEO] Argentina detected: ${cleanIP}`);
    return "🇦🇷 Argentina";
  }

  // South Africa
  if (
    cleanIP.startsWith("196.") ||
    cleanIP.startsWith("197.") ||
    cleanIP.startsWith("155.")
  ) {
    console.log(`[GEO] South Africa detected: ${cleanIP}`);
    return "🇿🇦 South Africa";
  }

  // Thailand
  if (
    cleanIP.startsWith("183.") ||
    cleanIP.startsWith("202.") ||
    cleanIP.startsWith("161.")
  ) {
    console.log(`[GEO] Thailand detected: ${cleanIP}`);
    return "🇹🇭 Thailand";
  }

  // Singapore
  if (
    cleanIP.startsWith("103.") ||
    cleanIP.startsWith("175.") ||
    cleanIP.startsWith("202.")
  ) {
    console.log(`[GEO] Singapore detected: ${cleanIP}`);
    return "🇸🇬 Singapore";
  }

  // European Union (general ranges)
  if (
    cleanIP.startsWith("185.") ||
    cleanIP.startsWith("194.") ||
    cleanIP.startsWith("212.") ||
    cleanIP.startsWith("217.") ||
    cleanIP.startsWith("193.")
  ) {
    console.log(`[GEO] Europe (general) detected: ${cleanIP}`);
    return "🇪🇺 Europe";
  }

  // African ranges (general)
  if (
    cleanIP.startsWith("41.") ||
    cleanIP.startsWith("102.") ||
    cleanIP.startsWith("105.") ||
    cleanIP.startsWith("197.")
  ) {
    console.log(`[GEO] Africa (general) detected: ${cleanIP}`);
    return "🌍 Africa";
  }

  // Asian ranges (general)
  if (
    cleanIP.startsWith("220.") ||
    cleanIP.startsWith("219.") ||
    cleanIP.startsWith("202.") ||
    cleanIP.startsWith("222.") ||
    cleanIP.startsWith("61.") ||
    cleanIP.startsWith("180.")
  ) {
    console.log(`[GEO] Asia (general) detected: ${cleanIP}`);
    return "🌏 Asia";
  }

  // South American ranges (general)
  if (cleanIP.startsWith("191.") || cleanIP.startsWith("170.")) {
    console.log(`[GEO] South America (general) detected: ${cleanIP}`);
    return "🌎 South America";
  }

  // Log unmatched IPs for debugging
  console.log(`[GEO] No match found for IP: "${cleanIP}" (original: "${ip}")`);

  return "🌐 Unknown Region";
};
