# 🛠️ Development Environment Setup Guide

## Current Status: ✅ READY TO TEST!

Your development environment is now configured with:

### ✅ 1. Dev Mode Authentication Bypass

- **Direct Access**: `http://localhost:8080/?dev=true#admin-seeding`
- **Auto-login**: Creates admin user automatically
- **No authentication required**: Bypasses age verification and login

### ❌ 2. Local Database Status

- **MongoDB**: Not running locally (ECONNREFUSED on port 27017)
- **Users**: Cannot check - database unavailable
- **Stories**: Cannot check - database unavailable

### 🚀 3. MongoDB Setup Options

#### Option A: Use MongoDB Atlas (Recommended)

1. **Update .env file**:

   ```bash
   cp .env.local .env
   # Edit .env and add your Atlas connection string
   ```

2. **Test connection**:
   ```bash
   npm run verify:local
   ```

#### Option B: Install MongoDB Locally

```bash
# On macOS with Homebrew:
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# On Ubuntu/Debian:
sudo apt update
sudo apt install mongodb
sudo systemctl start mongod

# On Windows:
# Download from https://www.mongodb.com/try/download/community
```

#### Option C: Use Docker (if available)

```bash
docker run -d --name mongodb-dev -p 27017:27017 mongo:latest
```

## 🧪 Testing Your Development Environment

### 1. Test Admin Interface (Works Now!)

Visit: `http://localhost:8080/?dev=true#admin-seeding`

**Expected Result**: Direct access to database seeding interface

### 2. Test API Endpoints (After MongoDB Setup)

```bash
# Test basic connection
curl http://localhost:8080/api/ping

# Test database (after MongoDB is running)
npm run verify:local
```

### 3. Seed Development Database

Once MongoDB is running:

```bash
npm run seed:local
```

## 🎯 Quick Start Steps

1. **Choose MongoDB option** (Atlas recommended for simplicity)
2. **Update .env** with your connection string
3. **Visit**: `http://localhost:8080/?dev=true#admin-seeding`
4. **Seed database** using the web interface
5. **Start developing!**

## 📊 Current Development URLs

| Feature           | URL                                             | Status                     |
| ----------------- | ----------------------------------------------- | -------------------------- |
| **Main App**      | `http://localhost:8080`                         | ✅ Working                 |
| **Dev Mode**      | `http://localhost:8080/?dev=true`               | ✅ Working (bypasses auth) |
| **Admin Seeding** | `http://localhost:8080/?dev=true#admin-seeding` | ✅ Ready to test           |
| **API Ping**      | `http://localhost:8080/api/ping`                | ✅ Working                 |

## 🔧 Troubleshooting

### If Admin Interface Shows Loading/Errors:

1. Check browser console for errors
2. Verify MongoDB connection string in .env
3. Try refreshing the page

### If Database Operations Fail:

1. Ensure MongoDB is running
2. Check .env file configuration
3. Test connection with `npm run verify:local`

Your development environment is now ready! The easiest next step is to test the admin interface directly.
