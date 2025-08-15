import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://joelmooyoung:YACXL0vbc8yvH8bw@cluster0.zki7s83.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    console.log("🔍 Testing MongoDB connection...");
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      dbName: "rude-gyal-confessions",
    });

    console.log("✅ MongoDB connected successfully!");
    
    // Test database ping
    await mongoose.connection.db.admin().ping();
    console.log("✅ Database ping successful!");
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📁 Collections found:", collections.map(c => c.name));
    
    // Check users collection
    const usersCollection = mongoose.connection.db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`👥 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const sampleUsers = await usersCollection.find({}, { 
        projection: { email: 1, username: 1, type: 1, active: 1, _id: 0 } 
      }).limit(5).toArray();
      console.log("👤 Sample users:", JSON.stringify(sampleUsers, null, 2));
    }
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔐 Disconnected from MongoDB");
  }
}

testConnection();
