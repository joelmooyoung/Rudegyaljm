import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Story, LoginLog, Comment } from "../models/index.js";

async function seedLocalDatabase() {
  try {
    console.log("🌱 Starting local MongoDB seeding...");

    // Connect to local MongoDB
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/rude-gyal-confessions";

    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    console.log("✅ Connected to local MongoDB");

    // Clear existing collections
    console.log("🧹 Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Story.deleteMany({}),
      LoginLog.deleteMany({}),
      Comment.deleteMany({}),
    ]);

    // Create users with hashed passwords
    console.log("👥 Creating users...");
    const saltRounds = 12;

    const users = [
      {
        userId: "admin1",
        username: "admin",
        email: "admin@nocturne.com",
        password: await bcrypt.hash("admin123", saltRounds),
        type: "admin",
        country: "United States",
        active: true,
        loginCount: 0,
      },
      {
        userId: "premium1",
        username: "premiumuser",
        email: "premium@test.com",
        password: await bcrypt.hash("premium123", saltRounds),
        type: "premium",
        country: "United States",
        active: true,
        loginCount: 0,
      },
      {
        userId: "free1",
        username: "freeuser",
        email: "free@test.com",
        password: await bcrypt.hash("free123", saltRounds),
        type: "free",
        country: "United States",
        active: true,
        loginCount: 0,
      },
      {
        userId: "inactive1",
        username: "inactiveuser",
        email: "inactive@test.com",
        password: await bcrypt.hash("inactive123", saltRounds),
        type: "free",
        country: "Canada",
        active: false,
        loginCount: 0,
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create sample stories
    console.log("📚 Creating stories...");
    const stories = [
      {
        storyId: "story1",
        title: "Midnight Desires",
        content: `The clock struck midnight as Sophia stepped onto the moonlit balcony, her silk nightgown flowing in the gentle breeze. She had been unable to sleep, her mind consumed by thoughts of the mysterious stranger she'd met at the masquerade ball just hours before.

His touch had been electric, sending shivers down her spine as they danced in the dimly lit ballroom. The way he'd whispered her name, his breath warm against her ear, had awakened something primal within her—a desire she'd never known existed.

Now, as she gazed up at the stars, she heard the soft rustle of leaves below. Her heart raced as a familiar figure emerged from the shadows of the garden. It was him—the man who had captivated her so completely with just one dance.

"I couldn't stay away," he called softly, his voice carrying on the night air. "You've bewitched me completely."

Sophia's breath caught in her throat. Every rational thought told her to retreat to her room, to forget this dangerous attraction. But her body betrayed her, moving of its own accord toward the spiral staircase that led to the garden below.

The forbidden nature of their meeting only heightened her arousal. She was a married woman, bound by duty and societal expectations, yet here she was, descending into the garden to meet a man whose name she didn't even know.

As she reached the bottom of the stairs, he stepped forward, his eyes drinking in the sight of her. "You came," he murmured, his voice thick with desire.

"I shouldn't have," she whispered, even as she moved closer to him.

"But you did." His hand reached out to caress her cheek, and she leaned into his touch, her resolve crumbling like sand. "Some things are worth the risk."

Their forbidden encounter under the starlit sky would ignite a passion that defied all reason, beginning a love affair that would challenge everything they thought they knew about desire and duty.`,
        author: "Luna Starweaver",
        category: "Romance",
        tags: ["Passionate", "Forbidden Love", "Midnight", "Garden", "Desire"],
        published: true,
        featured: false,
        views: 2340,
        likeCount: 45,
        averageRating: 4.8,
        ratingCount: 127,
      },
      {
        storyId: "story2",
        title: "The Executive's Secret",
        content: `Victoria Cross commanded respect in every boardroom she entered. As the youngest female CEO in the city's financial district, she had clawed her way to the top through determination, intelligence, and an unwavering focus on success. But behind her polished exterior and designer suits lay secrets that could unravel everything she had built.

It started innocently enough—late nights at the office, working alongside her brilliant and devastatingly handsome CFO, Marcus Reed. Their professional relationship had always been marked by mutual respect and undeniable chemistry that they had both fought to keep under control.

The evening everything changed began like any other. The office building was nearly empty, save for the soft glow emanating from the executive floor. Victoria was reviewing quarterly reports when Marcus knocked on her door, his tie loosened and his usually perfect hair slightly disheveled from the long day.

"Still working?" he asked, stepping into her office with two cups of coffee.

She looked up from her papers, acutely aware of how the lamplight caught the golden flecks in his brown eyes. "You know how it is. The company never sleeps."

Marcus set one cup on her desk and settled into the chair across from her. "Sometimes I wonder if you ever let yourself just... live."

Behind the mahogany doors of power, their forbidden attraction would either bind them together or destroy everything they had worked to build.

What followed was a passionate encounter that shattered every rule Victoria had ever set for herself. Against the floor-to-ceiling windows of her office, with the city lights twinkling below, they discovered a connection that transcended their professional relationship.`,
        author: "Scarlett Blackthorne",
        category: "Romance",
        tags: ["Office Romance", "Power", "CEO", "Forbidden", "Executive"],
        published: true,
        featured: true,
        views: 1580,
        likeCount: 67,
        averageRating: 4.9,
        ratingCount: 89,
      },
      {
        storyId: "story3",
        title: "Summer Heat",
        content: `The Mediterranean sun beat down mercilessly on the pristine white sands of the exclusive resort, but Isabella barely noticed the heat as she lounged by the infinity pool. She had come to Greece to escape—escape the pressure of her high-powered job, escape the expectations of her family, and most importantly, escape the lingering heartbreak from her recent divorce.

She never expected to be rescued from her solitude by a stranger with sun-kissed skin and eyes the color of the Aegean Sea.

"Mind if I join you?" The voice was smooth, accented with just a hint of something exotic that made her pulse quicken.

Isabella looked up from her book to find a man standing beside her lounger, and her breath caught in her throat. He was beautiful in the way that Greek statues were beautiful—all carved muscle and masculine grace, with dark hair that caught the sunlight and a smile that promised adventure.

A chance encounter at the beach resort would lead to seven days of unbridled passion that would transform her understanding of love and desire forever.

Each day brought new adventures and deeper intimacy. They explored secluded coves where they could swim naked in the warm Mediterranean waters. They shared intimate dinners at tavernas tucked away in mountain villages where no one knew their names or their stories.`,
        author: "Marina Solace",
        category: "Romance",
        tags: [
          "Beach Romance",
          "Vacation",
          "Mediterranean",
          "Summer",
          "Passion",
        ],
        published: true,
        featured: false,
        views: 2890,
        likeCount: 123,
        averageRating: 4.6,
        ratingCount: 156,
      },
      {
        storyId: "story4",
        title: "Whispers in the Library",
        content: `The old university library held secrets in more than just its ancient books. As head librarian, Elena Vasquez had always prided herself on knowing every corner of the vast building, from the public reading rooms to the restricted archives hidden in the basement. But lately, she had become aware of a new mystery that haunted the halls after closing time.

Someone was visiting the library at night.

It was on a rainy Thursday evening in October that she finally encountered him. A man stood before one of the tall windows, silhouetted against the storm-darkened glass. He was tall and lean, dressed in dark clothes that made him nearly invisible among the shadows of the stacks.

Their love had transcended the physical long ago, but in this moment, with all barriers between them removed, it reached new heights of intimacy among the ancient texts and watching eyes of centuries-old angels painted in gold and lapis lazuli.`,
        author: "Isadora Moonwood",
        category: "Romance",
        tags: ["Library", "Academic", "Mysterious", "Gothic", "Intellectual"],
        published: true,
        featured: false,
        views: 1240,
        likeCount: 89,
        averageRating: 4.8,
        ratingCount: 76,
      },
      {
        storyId: "story5",
        title: "Dragons of Eldoria",
        content: `In the mystical realm of Eldoria, where ancient magic flowed through every stone and leaf, the divide between humans and dragons had been absolute for over a thousand years. The Treaty of Flames, signed in blood and sealed with ancient magic, forbade any interaction between the species beyond the most formal diplomatic exchanges.

But Lyra Nightwhisper had never been one to follow rules.

As the realm's most gifted mage and daughter of the High Council's leader, she should have been the last person to break the sacred laws. Instead, she found herself scaling the treacherous peaks of Mount Drakmoor on a moonless night, her heart pounding with anticipation and fear in equal measure.

Their relationship was forbidden by ancient law, dangerous beyond measure, and absolutely irresistible.`,
        author: "Ember Dragonheart",
        category: "Fantasy",
        tags: ["Dragons", "Magic", "Forbidden Love", "Fantasy", "Shapeshifter"],
        published: false,
        featured: false,
        views: 45,
        likeCount: 2,
        averageRating: 0,
        ratingCount: 0,
      },
    ];

    const createdStories = await Story.insertMany(stories);
    console.log(`✅ Created ${createdStories.length} stories`);

    // Create sample comments
    console.log("💬 Creating sample comments...");
    const comments = [
      {
        commentId: "comment1",
        storyId: "story1",
        userId: "premium1",
        username: "premiumuser",
        comment:
          "Absolutely captivating! The imagery in this story is so vivid, I felt like I was right there in the garden.",
      },
      {
        commentId: "comment2",
        storyId: "story1",
        userId: "free1",
        username: "freeuser",
        comment:
          "Luna Starweaver has such a beautiful writing style. Can't wait to read more!",
      },
      {
        commentId: "comment3",
        storyId: "story2",
        userId: "free1",
        username: "freeuser",
        comment:
          "The tension in this office romance is incredible. Love the power dynamics!",
      },
      {
        commentId: "comment4",
        storyId: "story3",
        userId: "premium1",
        username: "premiumuser",
        comment:
          "This made me want to book a trip to Greece immediately! So romantic.",
      },
      {
        commentId: "comment5",
        storyId: "story4",
        userId: "admin1",
        username: "admin",
        comment:
          "Beautiful atmospheric writing. The library setting is perfect.",
      },
    ];

    const createdComments = await Comment.insertMany(comments);
    console.log(`✅ Created ${createdComments.length} comments`);

    // Create sample login logs
    console.log("📊 Creating sample login logs...");
    const loginLogs = [
      {
        logId: "log1",
        userId: "admin1",
        username: "admin",
        ip: "192.168.1.100",
        country: "United States",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        success: true,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        logId: "log2",
        userId: "premium1",
        username: "premiumuser",
        ip: "203.0.113.1",
        country: "Australia",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        success: true,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        logId: "log3",
        userId: "free1",
        username: "freeuser",
        ip: "81.2.69.142",
        country: "United Kingdom",
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
        success: true,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
    ];

    const createdLoginLogs = await LoginLog.insertMany(loginLogs);
    console.log(`✅ Created ${createdLoginLogs.length} login logs`);

    console.log("\n🎉 Local MongoDB seeding completed successfully!");
    console.log("\n📈 Summary:");
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Stories: ${createdStories.length}`);
    console.log(`- Comments: ${createdComments.length}`);
    console.log(`- Login Logs: ${createdLoginLogs.length}`);

    console.log("\n🔐 Test accounts created:");
    console.log("- Admin: admin@nocturne.com / admin123");
    console.log("- Premium: premium@test.com / premium123");
    console.log("- Free: free@test.com / free123");
    console.log("- Inactive: inactive@test.com / inactive123");

    await mongoose.disconnect();
    console.log("📴 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error seeding local database:", error);
    process.exit(1);
  }
}

// Run the seeding script
seedLocalDatabase();
