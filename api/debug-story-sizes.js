import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[DEBUG STORY SIZES] ${req.method} /api/debug-story-sizes`);

  if (req.method !== "GET") {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed" 
    });
  }

  try {
    console.log("[DEBUG STORY SIZES] Connecting to database...");
    await connectToDatabase();
    
    console.log("[DEBUG STORY SIZES] Getting stories collection...");
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    
    console.log("[DEBUG STORY SIZES] Getting document statistics...");
    
    // Get basic stats first
    const totalCount = await storiesCollection.countDocuments({ published: true });
    console.log(`[DEBUG STORY SIZES] Total published stories: ${totalCount}`);
    
    // Get first few documents to check sizes
    console.log("[DEBUG STORY SIZES] Sampling first 5 documents for size analysis...");
    const sampleStories = await storiesCollection.find({ published: true })
      .limit(5)
      .toArray();
    
    console.log(`[DEBUG STORY SIZES] Retrieved ${sampleStories.length} sample stories`);
    
    // Analyze document sizes
    const sizeAnalysis = sampleStories.map(story => {
      const contentSize = story.content ? story.content.length : 0;
      const totalSize = JSON.stringify(story).length;
      
      return {
        storyId: story.storyId,
        title: story.title,
        author: story.author,
        contentLength: contentSize,
        totalDocumentSize: totalSize,
        hasLargeContent: contentSize > 50000, // Flag if content > 50KB
        fields: Object.keys(story),
        fieldCount: Object.keys(story).length
      };
    });
    
    // Test different query approaches
    console.log("[DEBUG STORY SIZES] Testing query performance with different approaches...");
    
    const performanceTests = [];
    
    // Test 1: Query without content field
    try {
      const start1 = Date.now();
      const withoutContent = await storiesCollection.find(
        { published: true },
        { projection: { content: 0 } }
      ).limit(10).toArray();
      const time1 = Date.now() - start1;
      performanceTests.push({
        test: "10 stories without content field",
        time: `${time1}ms`,
        success: true,
        count: withoutContent.length
      });
    } catch (error) {
      performanceTests.push({
        test: "10 stories without content field",
        time: "Failed",
        success: false,
        error: error.message
      });
    }
    
    // Test 2: Query with content field but limited
    try {
      const start2 = Date.now();
      const withContent = await storiesCollection.find({ published: true })
        .limit(5).toArray();
      const time2 = Date.now() - start2;
      performanceTests.push({
        test: "5 stories with full content",
        time: `${time2}ms`,
        success: true,
        count: withContent.length
      });
    } catch (error) {
      performanceTests.push({
        test: "5 stories with full content",
        time: "Failed",
        success: false,
        error: error.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Story size analysis complete",
      totalStories: totalCount,
      sampleAnalysis: sizeAnalysis,
      performanceTests: performanceTests,
      recommendations: {
        largeContentDetected: sizeAnalysis.some(s => s.hasLargeContent),
        avgContentSize: Math.round(sizeAnalysis.reduce((sum, s) => sum + s.contentLength, 0) / sizeAnalysis.length),
        avgDocumentSize: Math.round(sizeAnalysis.reduce((sum, s) => sum + s.totalDocumentSize, 0) / sizeAnalysis.length)
      }
    });

  } catch (error) {
    console.error("[DEBUG STORY SIZES] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Story size analysis failed",
      error: error.message
    });
  }
}
