import { connectToDatabase } from "../lib/mongodb.js";
import bcrypt from "bcryptjs";
import { User, Story, LoginLog, Comment } from "../models/index.js";

export default async function handler(req, res) {
  // Only allow POST requests for security
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    await connectToDatabase();

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
        country: "Unknown",
        active: true,
        loginCount: 0,
      },
      {
        userId: "premium1",
        username: "premiumuser",
        email: "premium@test.com",
        password: await bcrypt.hash("premium123", saltRounds),
        type: "premium",
        country: "Unknown",
        active: true,
        loginCount: 0,
      },
      {
        userId: "free1",
        username: "freeuser",
        email: "free@test.com",
        password: await bcrypt.hash("free123", saltRounds),
        type: "free",
        country: "Unknown",
        active: true,
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

Their forbidden encounter under the starlit sky would ignite a passion that defied all reason, beginning a love affair that would challenge everything they thought they knew about desire and duty.`,
        author: "Luna Starweaver",
        category: "Romance",
        tags: ["Passionate", "Forbidden Love", "Midnight", "Garden", "Desire"],
        image: "", // Images should be uploaded via admin interface
        excerpt:
          "The clock struck midnight as Sophia stepped onto the moonlit balcony, her silk nightgown flowing in the gentle breeze. A mysterious stranger from the masquerade ball appears...",
        accessLevel: "free",
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

Behind the mahogany doors of power, their forbidden attraction would either bind them together or destroy everything they had worked to build.`,
        author: "Scarlett Blackthorne",
        category: "Romance",
        tags: ["Office Romance", "Power", "CEO", "Forbidden", "Executive"],
        image: "", // Images should be uploaded via admin interface
        excerpt:
          "Victoria Cross commanded respect in every boardroom she entered. As the youngest female CEO, she harbors secrets that could unravel everything she's built with her handsome CFO...",
        accessLevel: "premium",
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

A chance encounter at the beach resort would lead to seven days of unbridled passion that would transform her understanding of love and desire forever.`,
        author: "Marina Solace",
        category: "Romance",
        tags: [
          "Beach Romance",
          "Vacation",
          "Mediterranean",
          "Summer",
          "Passion",
        ],
        image:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop&q=80",
        excerpt:
          "The Mediterranean sun beat down mercilessly as Isabella lounged by the infinity pool, seeking escape from heartbreak. A stranger with Aegean-blue eyes would change everything...",
        accessLevel: "free",
        published: true,
        featured: false,
        views: 2890,
        likeCount: 123,
        averageRating: 4.6,
        ratingCount: 156,
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
    ];

    const createdComments = await Comment.insertMany(comments);
    console.log(`✅ Created ${createdComments.length} comments`);

    // Return success response
    res.status(200).json({
      success: true,
      message: "🎉 Database seeded successfully!",
      data: {
        users: createdUsers.length,
        stories: createdStories.length,
        comments: createdComments.length,
      },
      testAccounts: {
        admin: { email: "admin@nocturne.com", password: "admin123" },
        premium: { email: "premium@test.com", password: "premium123" },
        free: { email: "free@test.com", password: "free123" },
      },
    });
  } catch (error) {
    console.error("❌ Seeding error:", error);
    res.status(500).json({
      success: false,
      message: "Database seeding failed",
      error: error.message,
    });
  }
}
