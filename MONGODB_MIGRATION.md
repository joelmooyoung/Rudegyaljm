# MongoDB Migration Strategy

## Current JSON Persistence System

The application currently uses JSON files for data persistence:

- `data/stories.json` - Story data
- `data/comments.json` - Comment data
- `data/interactions.json` - Likes and ratings data

## Migration to MongoDB

### 1. Database Schema Design

#### Stories Collection

```javascript
{
  _id: ObjectId,
  id: String, // Keep existing string IDs for compatibility
  title: String,
  excerpt: String,
  content: String,
  author: String,
  category: String,
  tags: [String],
  accessLevel: String, // "free" | "premium"
  isPublished: Boolean,
  rating: Number,
  ratingCount: Number,
  viewCount: Number,
  commentCount: Number,
  image: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Comments Collection

```javascript
{
  _id: ObjectId,
  id: String, // Keep existing string IDs
  storyId: String, // Reference to story
  userId: String,
  username: String,
  content: String,
  isEdited: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Interactions Collection

```javascript
{
  _id: ObjectId,
  storyId: String,
  userId: String,
  type: String, // "like" | "rating"
  value: Mixed, // Boolean for likes, Number for ratings
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Migration Steps

#### Phase 1: Setup MongoDB Connection

1. Install MongoDB dependencies: `npm install mongodb mongoose`
2. Create database connection utilities in `server/db/`
3. Add MongoDB connection string to environment variables

#### Phase 2: Create Data Models

1. Create Mongoose schemas for Stories, Comments, Interactions
2. Add validation rules and indexes
3. Create database service layer

#### Phase 3: Data Migration

1. Create migration script to export JSON data using `exportDataForMigration()`
2. Transform data to match MongoDB schema
3. Import data into MongoDB collections
4. Verify data integrity

#### Phase 4: Update Application Code

1. Create database service layer with same interface as current JSON utilities
2. Replace `loadStories/saveStories` calls with MongoDB operations
3. Update interaction endpoints to use MongoDB
4. Add connection pooling and error handling

#### Phase 5: Testing & Deployment

1. Test with migrated data
2. Run both systems in parallel during transition
3. Monitor performance and data consistency
4. Switch production traffic to MongoDB

### 3. Database Service Interface

Keep the same interface for easy migration:

```typescript
// Current JSON interface
export const loadStories = (): Story[] => {
  /* ... */
};
export const saveStories = (stories: Story[]): void => {
  /* ... */
};

// Future MongoDB interface (same signatures)
export const loadStories = async (): Promise<Story[]> => {
  /* MongoDB query */
};
export const saveStories = async (stories: Story[]): Promise<void> => {
  /* MongoDB upsert */
};
```

### 4. Environment Configuration

```env
# Development
DATABASE_URL=mongodb://localhost:27017/rudegyal_dev

# Production
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/rudegyal_prod
```

### 5. Migration Script Template

```typescript
// scripts/migrate-to-mongodb.ts
import { exportDataForMigration } from "../server/utils/dataStore";
import { connectToMongoDB, Story, Comment, Interaction } from "../server/db";

async function migrate() {
  const data = exportDataForMigration();

  await connectToMongoDB();

  // Migrate stories
  await Story.insertMany(data.stories);

  // Migrate comments
  await Comment.insertMany(data.comments);

  // Transform and migrate interactions
  const interactions = transformInteractions(data.interactions);
  await Interaction.insertMany(interactions);

  console.log("Migration completed successfully");
}
```

### 6. Rollback Strategy

1. Keep JSON files as backup during transition
2. Create rollback script to export from MongoDB back to JSON
3. Have database snapshots before migration
4. Test rollback procedure in staging environment

### 7. Performance Considerations

1. **Indexes**: Add indexes on frequently queried fields

   - `stories.accessLevel` for filtering
   - `stories.isPublished` for published stories
   - `comments.storyId` for story comments
   - `interactions.storyId + interactions.userId` for user interactions

2. **Aggregation**: Use MongoDB aggregation for complex queries

   - Story statistics (ratings, comments count)
   - User interaction summaries

3. **Connection Management**: Use connection pooling for production
4. **Caching**: Consider Redis for frequently accessed data

This strategy allows for a smooth transition from JSON persistence to MongoDB while maintaining data integrity and application functionality.
