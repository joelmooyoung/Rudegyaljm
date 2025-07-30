// Hardcoded stories that always work - no database needed
export default function handler(req, res) {
  console.log("Hardcoded stories endpoint called");

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  // Hardcoded sample stories
  const stories = [
    {
      id: "story-001",
      title: "Midnight Whispers",
      content: "<p>In the sultry heat of a Caribbean night, Maria found herself drawn to the mysterious stranger who had been watching her from across the resort pool...</p><p>His dark eyes held secrets she desperately wanted to uncover, and when he finally approached, his voice was like velvet against her skin.</p><p>'I've been waiting for you,' he whispered, his accent thick with promise. 'All evening, all my life.'</p>",
      excerpt: "A chance encounter at a Caribbean resort leads to an unforgettable night of passion and mystery.",
      author: "Jasmine Rose",
      category: "Romance",
      tags: ["passionate", "romance", "vacation", "mystery"],
      accessLevel: "free",
      isPublished: true,
      publishedAt: new Date("2024-01-15"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      viewCount: 1247,
      rating: 4.8,
      ratingCount: 89,
      image: null
    },
    {
      id: "story-002", 
      title: "The Professor's Secret",
      content: "<p>Elena had always been the best student in Professor Martinez's literature class, but tonight's private study session was about to become something much more intimate...</p><p>As rain pattered against the library windows, she found herself alone with the man who had been the subject of her secret fantasies for months.</p><p>'You understand the poetry better than any student I've ever taught,' he said, moving closer. 'But I wonder if you understand the passion behind the words.'</p>",
      excerpt: "A brilliant student discovers that some lessons can only be learned after hours.",
      author: "Carmen Silva",
      category: "Forbidden",
      tags: ["forbidden", "academic", "intellectual", "tension"],
      accessLevel: "premium",
      isPublished: true,
      publishedAt: new Date("2024-01-20"),
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-20"),
      viewCount: 2156,
      rating: 4.9,
      ratingCount: 134,
      image: null
    },
    {
      id: "story-003",
      title: "Dancing in the Dark",
      content: "<p>The salsa club was crowded, but Sophia only had eyes for one man. His hips moved to the rhythm like liquid fire, and when he extended his hand to her, she knew her quiet life was about to change forever...</p><p>'Baila conmigo,' he murmured, pulling her close enough that she could feel his heartbeat against her chest. The music pulsed through them both, a primal rhythm that spoke of desire older than words.</p>",
      excerpt: "A shy librarian discovers her wild side on the dance floor with a captivating stranger.",
      author: "Isabella Morales",
      category: "Seductive",
      tags: ["dance", "transformation", "passionate", "music"],
      accessLevel: "free",
      isPublished: true,
      publishedAt: new Date("2024-01-25"),
      createdAt: new Date("2024-01-25"),
      updatedAt: new Date("2024-01-25"),
      viewCount: 892,
      rating: 4.6,
      ratingCount: 67,
      image: null
    },
    {
      id: "story-004",
      title: "Summer Storm",
      content: "<p>When the power went out during the thunderstorm, Amelia thought she was alone in the beach house. But then she heard footsteps on the deck, and realized her mysterious neighbor had come to check on her...</p><p>By candlelight, with rain lashing the windows, they talked until dawn. But it wasn't just conversation that kept them awake all night.</p>",
      excerpt: "A power outage brings two lonely hearts together during a wild summer storm.",
      author: "Maya Rodriguez",
      category: "Romance",
      tags: ["storm", "neighbors", "candlelight", "intimate"],
      accessLevel: "premium",
      isPublished: true,
      publishedAt: new Date("2024-01-30"),
      createdAt: new Date("2024-01-30"),
      updatedAt: new Date("2024-01-30"),
      viewCount: 1634,
      rating: 4.7,
      ratingCount: 102,
      image: null
    },
    {
      id: "story-005",
      title: "Art of Desire",
      content: "<p>Painting the male figure had always been academic for Rosa, until the day Marcus walked into her art studio. His sculpted physique was perfection, but it was the intensity in his eyes that made her hand tremble as she tried to capture his essence on canvas...</p><p>'Am I making you nervous?' he asked during their third session, noticing how she couldn't quite meet his gaze. 'Perhaps we should take a break from the formal poses.'</p>",
      excerpt: "An artist finds inspiration and passion when the perfect model walks into her studio.",
      author: "Valentina Cruz",
      category: "Fantasy", 
      tags: ["art", "model", "studio", "creative"],
      accessLevel: "free",
      isPublished: true,
      publishedAt: new Date("2024-02-05"),
      createdAt: new Date("2024-02-05"),
      updatedAt: new Date("2024-02-05"),
      viewCount: 976,
      rating: 4.5,
      ratingCount: 78,
      image: null
    }
  ];

  return res.status(200).json(stories);
}
