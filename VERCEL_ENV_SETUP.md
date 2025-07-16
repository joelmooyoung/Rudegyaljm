# 🔧 Vercel Environment Variables Setup

## ✅ Required Environment Variables

Add these **exact values** in your Vercel project settings:

### **1. MONGODB_URI** (REQUIRED)

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/rude-gyal-confessions?retryWrites=true&w=majority
```

**Note**: Replace `username`, `password`, and `cluster` with your actual MongoDB Atlas credentials

### **2. NODE_ENV** (REQUIRED)

```
NODE_ENV = production
```

### **3. Optional Variables**

```
NEXT_PUBLIC_APP_URL = https://rudegyaljm.vercel.app
SEED_DB = false
```

## 🚀 Steps to Add Variables

1. **Go to**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Find**: Your `rudegyaljm` project
3. **Click**: Project name
4. **Go to**: Settings → Environment Variables
5. **Add each variable**:
   - Name: `MONGODB_URI`
   - Value: Your MongoDB connection string
   - Environment: Production
6. **Click**: "Save"
7. **Repeat** for `NODE_ENV = production`

## 🔄 After Adding Variables

1. **Go to**: Deployments tab
2. **Click**: "..." menu on latest deployment
3. **Click**: "Redeploy"
4. **Wait**: For deployment to complete
5. **Test**: https://rudegyaljm.vercel.app/api/ping

## ✅ Expected Results After Fix

### Working API Response:

```json
{
  "success": true,
  "message": "Hello from Express server!",
  "environment": "production",
  "database": {
    "configured": true,
    "status": "MongoDB URI available"
  }
}
```

### Working App:

- Main app loads (not 404)
- Auth page shows
- Database seeding works
- Login functionality works

## 🚨 If Still Not Working

Check Vercel deployment logs:

1. **Deployments** → **Click on deployment**
2. **View "Function Logs"**
3. **Look for errors** related to MongoDB or API routes

The issue is likely one of:

- MongoDB connection string format
- IP whitelist in MongoDB Atlas
- Vercel function configuration
