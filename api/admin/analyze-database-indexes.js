// Database Index Analysis Script
import { connectToDatabase } from "../../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[ANALYZE INDEXES] ${req.method} /api/admin/analyze-database-indexes`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: "Database connection not available"
      });
    }

    const db = mongoose.connection.db;
    const analysis = {};

    console.log("[ANALYZE INDEXES] Starting database index analysis...");

    // List of collections to analyze
    const collections = [
      'users',
      'stories', 
      'comments',
      'likes',
      'ratings',
      'loginlogs',
      'errorlogs',
      'userstoryreads'
    ];

    // Analyze each collection
    for (const collectionName of collections) {
      try {
        console.log(`[ANALYZE INDEXES] Analyzing ${collectionName} collection...`);
        
        const collection = db.collection(collectionName);
        
        // Get current indexes
        const indexes = await collection.listIndexes().toArray();
        
        // Get collection stats
        const stats = await collection.stats();
        
        // Get index usage stats (MongoDB 3.2+)
        let indexUsage = [];
        try {
          indexUsage = await collection.aggregate([
            { $indexStats: {} }
          ]).toArray();
        } catch (indexStatsError) {
          console.log(`[ANALYZE INDEXES] Index usage stats not available for ${collectionName}`);
        }

        analysis[collectionName] = {
          totalDocuments: stats.count || 0,
          totalSize: stats.size || 0,
          averageDocumentSize: stats.avgObjSize || 0,
          indexes: indexes.map(index => ({
            name: index.name,
            key: index.key,
            unique: index.unique || false,
            background: index.background || false,
            sparse: index.sparse || false,
            size: index.size || 0
          })),
          indexUsage: indexUsage.map(usage => ({
            name: usage.name,
            accesses: usage.accesses || {}
          })),
          totalIndexes: indexes.length,
          indexSizeTotal: indexes.reduce((total, idx) => total + (idx.size || 0), 0)
        };

      } catch (collectionError) {
        console.log(`[ANALYZE INDEXES] Error analyzing ${collectionName}:`, collectionError.message);
        analysis[collectionName] = {
          error: collectionError.message,
          exists: false
        };
      }
    }

    // Analyze overall database statistics
    const dbStats = await db.stats();
    
    // Recommendations based on analysis
    const recommendations = generateRecommendations(analysis);

    const result = {
      success: true,
      databaseStats: {
        totalCollections: dbStats.collections || 0,
        totalDataSize: dbStats.dataSize || 0,
        totalIndexSize: dbStats.indexSize || 0,
        averageObjectSize: dbStats.avgObjSize || 0
      },
      collections: analysis,
      recommendations,
      timestamp: new Date().toISOString()
    };

    console.log(`[ANALYZE INDEXES] ✅ Analysis complete for ${collections.length} collections`);

    return res.status(200).json(result);

  } catch (error) {
    console.error("[ANALYZE INDEXES] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze database indexes",
      error: error.message
    });
  }
}

function generateRecommendations(analysis) {
  const recommendations = [];

  Object.entries(analysis).forEach(([collectionName, data]) => {
    if (data.error) {
      recommendations.push({
        collection: collectionName,
        type: "error",
        priority: "high",
        message: `Collection ${collectionName} could not be analyzed: ${data.error}`
      });
      return;
    }

    // Check for missing statistics-critical indexes
    const indexNames = data.indexes.map(idx => idx.name);
    
    switch (collectionName) {
      case 'users':
        if (!indexNames.some(name => name.includes('createdAt'))) {
          recommendations.push({
            collection: collectionName,
            type: "missing_index",
            priority: "high",
            message: "Missing createdAt index for user registration analytics"
          });
        }
        if (!indexNames.some(name => name.includes('active'))) {
          recommendations.push({
            collection: collectionName,
            type: "missing_index", 
            priority: "medium",
            message: "Missing active index for active user filtering"
          });
        }
        break;

      case 'stories':
        if (!indexNames.some(name => name.includes('published') && name.includes('createdAt'))) {
          recommendations.push({
            collection: collectionName,
            type: "missing_index",
            priority: "high",
            message: "Missing compound published+createdAt index for story listing queries"
          });
        }
        break;

      case 'comments':
      case 'likes':
      case 'ratings':
        if (!indexNames.some(name => name.includes('createdAt'))) {
          recommendations.push({
            collection: collectionName,
            type: "missing_index",
            priority: "medium",
            message: `Missing createdAt index for ${collectionName} time-based analytics`
          });
        }
        break;

      case 'loginlogs':
        if (!indexNames.some(name => name.includes('timestamp'))) {
          recommendations.push({
            collection: collectionName,
            type: "missing_index",
            priority: "high",
            message: "Missing timestamp index for login analytics"
          });
        }
        break;
    }

    // Check for collections with many documents but few indexes
    if (data.totalDocuments > 1000 && data.totalIndexes < 3) {
      recommendations.push({
        collection: collectionName,
        type: "performance",
        priority: "medium",
        message: `Collection has ${data.totalDocuments} documents but only ${data.totalIndexes} indexes`
      });
    }

    // Check for very large collections without proper indexing
    if (data.totalDocuments > 10000 && data.indexSizeTotal / data.totalSize < 0.1) {
      recommendations.push({
        collection: collectionName,
        type: "performance",
        priority: "high",
        message: "Large collection with insufficient index coverage"
      });
    }

    // Check for unused indexes (if usage data available)
    data.indexUsage.forEach(usage => {
      if (usage.name !== '_id_' && (!usage.accesses.ops || usage.accesses.ops === 0)) {
        recommendations.push({
          collection: collectionName,
          type: "unused_index",
          priority: "low",
          message: `Index '${usage.name}' appears to be unused and could be removed`
        });
      }
    });
  });

  return recommendations;
}
