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

  // Remove port numbers if present (only for IPv4, not IPv6)
  // IPv6 addresses contain colons as part of their format, so we need to be careful
  // Port numbers in IPv6 are enclosed in brackets: [2001:db8::1]:8080
  if (cleanIP.includes("]:")) {
    // IPv6 with port: [2001:db8::1]:8080 -> 2001:db8::1
    cleanIP = cleanIP.substring(1, cleanIP.indexOf("]:"));
  } else if (
    cleanIP.includes(":") &&
    !cleanIP.includes("::") &&
    cleanIP.split(":").length === 2
  ) {
    // IPv4 with port: 192.168.1.1:8080 -> 192.168.1.1
    const parts = cleanIP.split(":");
    if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
      cleanIP = parts[0];
    }
  }

  console.log(
    `[GEO] Detecting country for IP: "${ip}" -> cleaned: "${cleanIP}"`,
  );

  // IPv6 address detection
  if (cleanIP.includes(":")) {
    console.log(`[GEO] IPv6 address detected: ${cleanIP}`);

    // IPv6 localhost
    if (cleanIP === "::1") {
      console.log(`[GEO] IPv6 localhost detected: ${cleanIP}`);
      return "🏠 Localhost";
    }

    // United States IPv6 ranges
    if (
      cleanIP.startsWith("2001:4860:") || // Google
      cleanIP.startsWith("2607:f8b0:") || // Google
      cleanIP.startsWith("2600:") || // Various US ISPs
      cleanIP.startsWith("2601:") || // Comcast/Xfinity
      cleanIP.startsWith("2602:") || // Various US ISPs
      cleanIP.startsWith("2603:") || // Various US ISPs
      cleanIP.startsWith("2604:") || // Various US ISPs
      cleanIP.startsWith("2605:") || // Various US ISPs
      cleanIP.startsWith("2606:") || // Various US ISPs
      cleanIP.startsWith("2607:") || // Various US ISPs
      cleanIP.startsWith("2620:") || // Various US organizations
      cleanIP.startsWith("2001:550:") || // US ISPs
      cleanIP.startsWith("2610:") // US ISPs
    ) {
      console.log(`[GEO] United States IPv6 detected: ${cleanIP}`);
      return "🇺🇸 United States";
    }

    // Canada IPv6 ranges
    if (cleanIP.startsWith("2001:56a:") || cleanIP.startsWith("2607:5300:")) {
      console.log(`[GEO] Canada IPv6 detected: ${cleanIP}`);
      return "🇨🇦 Canada";
    }

    // United Kingdom IPv6 ranges
    if (cleanIP.startsWith("2001:ba8:") || cleanIP.startsWith("2a00:")) {
      console.log(`[GEO] United Kingdom IPv6 detected: ${cleanIP}`);
      return "🇬🇧 United Kingdom";
    }

    // European IPv6 ranges (general)
    if (
      cleanIP.startsWith("2a01:") ||
      cleanIP.startsWith("2a02:") ||
      cleanIP.startsWith("2a03:") ||
      cleanIP.startsWith("2a04:") ||
      cleanIP.startsWith("2a05:") ||
      cleanIP.startsWith("2a06:") ||
      cleanIP.startsWith("2a07:")
    ) {
      console.log(`[GEO] Europe IPv6 detected: ${cleanIP}`);
      return "🇪🇺 Europe";
    }

    // Asian IPv6 ranges (general)
    if (
      cleanIP.startsWith("2001:200:") ||
      cleanIP.startsWith("2001:da8:") ||
      cleanIP.startsWith("240")
    ) {
      console.log(`[GEO] Asia IPv6 detected: ${cleanIP}`);
      return "🌏 Asia";
    }

    // Log unknown IPv6 for debugging
    console.log(`[GEO] Unknown IPv6 range: ${cleanIP}`);
    return "🌐 Unknown Region (IPv6)";
  }

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
    cleanIP.startsWith("159.") ||
    cleanIP.startsWith("172.58.") || // AT&T/Verizon US range
    cleanIP.startsWith("172.59.") || // AT&T/Verizon US range
    cleanIP.startsWith("172.60.") || // US ISP ranges
    cleanIP.startsWith("172.61.") || // US ISP ranges
    cleanIP.startsWith("172.62.") || // US ISP ranges
    cleanIP.startsWith("172.63.")    // US ISP ranges
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

// City detection function based on IP address
export const getCityFromIP = (ip: string): string => {
  // Clean up IP address
  if (!ip || ip === "unknown" || ip === "undefined" || ip === "null") {
    return "Unknown City";
  }

  let cleanIP = ip.trim();
  if (cleanIP.startsWith("::ffff:")) {
    cleanIP = cleanIP.substring(7);
  }

  // Handle port removal
  if (cleanIP.includes("]:")) {
    cleanIP = cleanIP.substring(1, cleanIP.indexOf("]:"));
  } else if (
    cleanIP.includes(":") &&
    !cleanIP.includes("::") &&
    cleanIP.split(":").length === 2
  ) {
    const parts = cleanIP.split(":");
    if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
      cleanIP = parts[0];
    }
  }

  console.log(`[GEO CITY] Detecting city for IP: "${ip}" -> cleaned: "${cleanIP}"`);

  // Localhost
  if (cleanIP === "127.0.0.1" || cleanIP === "::1" || cleanIP === "localhost") {
    return "Localhost";
  }

  // Private networks
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
    return "Private Network";
  }

  // IPv6 address detection for cities
  if (cleanIP.includes(":")) {
    console.log(`[GEO CITY] IPv6 address detected: ${cleanIP}`);

    // IPv6 localhost
    if (cleanIP === "::1") {
      return "Localhost";
    }

    // Major US IPv6 ranges with city detection
    // Comcast/Xfinity IPv6 ranges
    if (cleanIP.startsWith("2607:fb90:")) {
      return "Philadelphia, PA"; // Comcast HQ region
    }
    if (cleanIP.startsWith("2607:f8b0:")) {
      return "Chicago, IL"; // Google IPv6 Chicago
    }
    if (cleanIP.startsWith("2001:4860:")) {
      return "Mountain View, CA"; // Google IPv6
    }

    // General US IPv6 ranges by region
    if (cleanIP.startsWith("2600:") || cleanIP.startsWith("2601:")) {
      return "Denver, CO"; // Major US ISP hub
    }
    if (cleanIP.startsWith("2602:") || cleanIP.startsWith("2603:")) {
      return "Atlanta, GA"; // Southeastern US hub
    }
    if (cleanIP.startsWith("2604:") || cleanIP.startsWith("2605:")) {
      return "Dallas, TX"; // Central US hub
    }
    if (cleanIP.startsWith("2606:") || cleanIP.startsWith("2607:")) {
      return "New York, NY"; // Northeastern US hub
    }
    if (cleanIP.startsWith("2620:")) {
      return "San Francisco, CA"; // West Coast organizations
    }

    // Canadian IPv6 ranges
    if (cleanIP.startsWith("2001:56a:")) {
      return "Toronto, ON";
    }
    if (cleanIP.startsWith("2607:5300:")) {
      return "Montreal, QC";
    }

    // European IPv6 ranges
    if (cleanIP.startsWith("2a00:") || cleanIP.startsWith("2a01:")) {
      return "London, UK";
    }
    if (cleanIP.startsWith("2a02:") || cleanIP.startsWith("2a03:")) {
      return "Amsterdam, Netherlands";
    }
    if (cleanIP.startsWith("2a04:") || cleanIP.startsWith("2a05:")) {
      return "Frankfurt, Germany";
    }

    // If it's IPv6 but no specific match, return based on country
    const country = getCountryFromIP(cleanIP);
    if (country.includes("United States")) {
      return "United States";
    } else if (country.includes("Canada")) {
      return "Canada";
    } else if (country.includes("Europe") || country.includes("United Kingdom")) {
      return "Europe";
    }

    return "Unknown City (IPv6)";
  }

  // Major US cities based on ISP IP ranges
  // Google/Mountain View
  if (cleanIP.startsWith("8.8.8.") || cleanIP.startsWith("8.8.4.")) {
    return "Mountain View, CA";
  }

  // Cloudflare (multiple locations, default to San Francisco)
  if (cleanIP.startsWith("1.1.1.") || cleanIP.startsWith("1.0.0.")) {
    return "San Francisco, CA";
  }

  // AWS regions (approximate)
  if (cleanIP.startsWith("52.") || cleanIP.startsWith("54.") || cleanIP.startsWith("3.")) {
    if (cleanIP.startsWith("52.0.") || cleanIP.startsWith("54.80.")) {
      return "Ashburn, VA"; // US-East-1
    } else if (cleanIP.startsWith("52.8.") || cleanIP.startsWith("54.176.")) {
      return "San Francisco, CA"; // US-West-1
    } else if (cleanIP.startsWith("52.24.") || cleanIP.startsWith("54.200.")) {
      return "Portland, OR"; // US-West-2
    } else {
      return "Cloud Service";
    }
  }

  // Common US ISP ranges with city approximations
  // AT&T/Verizon ranges
  if (cleanIP.startsWith("172.58.") || cleanIP.startsWith("172.59.")) {
    return "Dallas, TX"; // Major AT&T hub
  }

  if (cleanIP.startsWith("76.28.")) {
    return "New York, NY"; // Verizon FiOS
  }

  if (cleanIP.startsWith("98.") || cleanIP.startsWith("67.")) {
    return "Chicago, IL"; // Comcast major hub
  }

  if (cleanIP.startsWith("24.") || cleanIP.startsWith("99.")) {
    return "Toronto, ON"; // Canadian ISPs
  }

  // UK major cities
  if (cleanIP.startsWith("81.") || cleanIP.startsWith("86.")) {
    return "London, UK";
  }

  // Germany
  if (cleanIP.startsWith("46.") || cleanIP.startsWith("78.")) {
    return "Berlin, Germany";
  }

  // France
  if (cleanIP.startsWith("80.") || cleanIP.startsWith("82.")) {
    return "Paris, France";
  }

  // Japan
  if (cleanIP.startsWith("27.") || cleanIP.startsWith("110.")) {
    return "Tokyo, Japan";
  }

  // Australia
  if (cleanIP.startsWith("203.") || cleanIP.startsWith("101.")) {
    return "Sydney, Australia";
  }

  // China
  if (cleanIP.startsWith("36.") || cleanIP.startsWith("58.")) {
    return "Beijing, China";
  }

  // India
  if (cleanIP.startsWith("49.") || cleanIP.startsWith("117.")) {
    return "Mumbai, India";
  }

  // Brazil
  if (cleanIP.startsWith("177.") || cleanIP.startsWith("189.")) {
    return "São Paulo, Brazil";
  }

  // General US regions based on IP ranges
  if (
    cleanIP.startsWith("104.") ||
    cleanIP.startsWith("107.") ||
    cleanIP.startsWith("173.") ||
    cleanIP.startsWith("184.")
  ) {
    return "Los Angeles, CA";
  }

  if (
    cleanIP.startsWith("76.") ||
    cleanIP.startsWith("75.") ||
    cleanIP.startsWith("96.")
  ) {
    return "New York, NY";
  }

  if (
    cleanIP.startsWith("74.") ||
    cleanIP.startsWith("71.") ||
    cleanIP.startsWith("67.")
  ) {
    return "Chicago, IL";
  }

  // Default based on country detection
  const country = getCountryFromIP(cleanIP);
  if (country.includes("United States")) {
    return "United States";
  } else if (country.includes("Canada")) {
    return "Canada";
  } else if (country.includes("United Kingdom")) {
    return "United Kingdom";
  } else if (country.includes("Germany")) {
    return "Germany";
  } else if (country.includes("France")) {
    return "France";
  } else if (country.includes("Japan")) {
    return "Japan";
  } else if (country.includes("Australia")) {
    return "Australia";
  } else if (country.includes("China")) {
    return "China";
  } else if (country.includes("India")) {
    return "India";
  } else if (country.includes("Brazil")) {
    return "Brazil";
  }

  console.log(`[GEO CITY] No specific city found for IP: "${cleanIP}"`);
  return "Unknown City";
};
