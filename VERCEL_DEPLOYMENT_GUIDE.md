# 🚀 Vercel Deployment Guide for Rude Gyal Confessions

## 📋 Pre-Deployment Checklist

- ✅ App built successfully (`npm run build`)
- ✅ MongoDB Atlas database configured
- ✅ Environment variables prepared
- ✅ API endpoints tested

## 🛠️ Step-by-Step Deployment

### 1. Prepare Your MongoDB Connection String

**You need your MongoDB Atlas connection string.** It should look like:

```
mongodb+srv://username:password@cluster.mongodb.net/rude-gyal-confessions?retryWrites=true&w=majority
```

⚠️ **Replace `username`, `password`, and `cluster` with your actual values!**

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your repository** (or upload files)
4. **Configure Environment Variables** (CRITICAL STEP):
   ```
   MONGODB_URI = your-actual-mongodb-connection-string
   NODE_ENV = production
   NEXT_PUBLIC_APP_URL = https://your-app-name.vercel.app
   ```
5. **Click "Deploy"**

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
npm run deploy
```

### 3. Configure Environment Variables in Vercel

🔴 **CRITICAL**: After deployment, you MUST set environment variables:

1. **Go to your Vercel dashboard**
2. **Click on your project**
3. **Go to "Settings" → "Environment Variables"**
4. **Add these variables**:

| Variable              | Value                         | Notes                                  |
| --------------------- | ----------------------------- | -------------------------------------- |
| `MONGODB_URI`         | `mongodb+srv://...`           | **REQUIRED** - Your MongoDB connection |
| `NODE_ENV`            | `production`                  | Sets production mode                   |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your Vercel app URL                    |
| `SEED_DB`             | `false`                       | Optional - disables auto-seeding       |

### 4. Test Your Deployment

After deployment, test these URLs:

1. **Main App**: `https://your-app.vercel.app`
2. **API Health Check**: `https://your-app.vercel.app/api/ping`
3. **Database Seeding**: `https://your-app.vercel.app/?dev=true#admin-seeding`

## 🧪 Testing Your APIs

### Test API Connectivity

```bash
curl https://your-app.vercel.app/api/ping
```

Expected response:

```json
{
  "success": true,
  "message": "Hello from Express server!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Database Seeding

Visit: `https://your-app.vercel.app/?dev=true#admin-seeding`

## 🐛 Troubleshooting Common Issues

### Issue: 404 Error on Vercel

**Cause**: Missing environment variables or failed build
**Solution**:

1. Check Vercel deployment logs
2. Verify `MONGODB_URI` is set correctly
3. Redeploy after setting environment variables

### Issue: API Endpoints Return 500 Error

**Cause**: MongoDB connection failed
**Solution**:

1. Verify MongoDB Atlas connection string
2. Check IP whitelist in MongoDB Atlas (allow `0.0.0.0/0` for Vercel)
3. Ensure database user has read/write permissions

### Issue: Database Seeding Fails

**Cause**: Network restrictions or invalid connection
**Solution**:

1. Use the web-based seeding interface: `/?dev=true#admin-seeding`
2. Check MongoDB Atlas network access settings
3. Verify connection string includes database name

### Issue: CORS Errors

**Cause**: Cross-origin restrictions
**Solution**: API middleware already handles CORS - check browser console for specific errors

## 🔧 Manual Database Setup (If Needed)

If automatic seeding fails, you can manually populate your database:

### Test Accounts to Create:

```json
{
  "email": "admin@nocturne.com",
  "password": "admin123",
  "username": "admin",
  "role": "admin"
}
```

## 📱 Accessing the Admin Panel

After successful deployment and database seeding:

1. **Visit**: `https://your-app.vercel.app/?dev=true#admin-seeding`
2. **Seed the database** using the web interface
3. **Login** with admin account: `admin@nocturne.com` / `admin123`

## 🎯 Quick Verification Steps

1. ✅ **App loads**: Visit your Vercel URL
2. ✅ **API works**: Check `/api/ping` endpoint
3. ✅ **Database connects**: Use seeding interface
4. ✅ **Login works**: Test with admin account

## 🆘 If Still Having Issues

1. **Check Vercel deployment logs** in the dashboard
2. **Verify MongoDB Atlas** connection string and network settings
3. **Test API endpoints** individually
4. **Check browser console** for client-side errors

---

## 📞 Next Steps After Successful Deployment

1. **Test all functionality** with the admin account
2. **Create regular user accounts**
3. **Upload sample stories** to test the content system
4. **Configure custom domain** (optional)

Your app should now be fully functional at your Vercel URL! 🎉
