# MongoDB Setup Guide

The application has been successfully converted from JSON file persistence to MongoDB. Here's how to set it up:

## 🚀 Quick Start

### 1. Install MongoDB

**For macOS (using Homebrew):**

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**For Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**For Windows:**

- Download MongoDB Community Server from https://www.mongodb.com/try/download/community
- Follow the installation wizard
- Start MongoDB as a service

**Using Docker:**

```bash
docker run --name mongodb -d -p 27017:27017 mongo:latest
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/rude-gyal-confessions
SEED_DB=false
PORT=8080
```

### 3. Seed the Database

Run the seeding script to populate the database with sample data:

```bash
npm run seed
```

This will create:

- **5 test users** with different roles (admin, premium, free)
- **7 sample stories** with rich content
- **Login logs** and **comments**

### 4. Start the Application

```bash
npm run dev
```

## 🔐 Test Accounts

After seeding, you can log in with these accounts:

| Role    | Email              | Password   |
| ------- | ------------------ | ---------- |
| Admin   | admin@nocturne.com | admin123   |
| Premium | premium@test.com   | premium123 |
| Free    | free@test.com      | free123    |

## 📊 What Changed

### Database Migration

- ✅ Users: MongoDB with proper password hashing (bcrypt)
- ✅ Stories: Full text search, proper indexing
- ✅ Login Logs: Enhanced IP geolocation tracking
- ✅ Error Logs: Centralized error tracking
- ✅ Comments: Story interaction system

### New Features

- **Password Security**: Bcrypt hashing with salt rounds
- **Enhanced Search**: MongoDB full-text search capabilities
- **Better Performance**: Database indexing for fast queries
- **IPv6 Support**: Enhanced IP geolocation for global users
- **Comprehensive Logging**: All actions tracked in MongoDB

### API Endpoints

All existing API endpoints continue to work, but now use MongoDB:

- `POST /api/auth/login` - Enhanced security
- `POST /api/auth/register` - Secure password hashing
- `GET /api/stories` - Fast database queries
- `GET /api/users` - Admin user management
- `GET /api/admin/login-logs` - Enhanced IP tracking

## 🛠️ Development Commands

```bash
# Seed database with sample data
npm run seed

# Force re-seed (clears existing data)
npm run seed:force

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Build for production
npm run build
```

## 🔧 Configuration

### MongoDB Connection String Examples

**Local MongoDB:**

```
MONGODB_URI=mongodb://localhost:27017/rude-gyal-confessions
```

**MongoDB Atlas (Cloud):**

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rude-gyal-confessions
```

**MongoDB with Authentication:**

```
MONGODB_URI=mongodb://username:password@localhost:27017/rude-gyal-confessions
```

## 📈 Performance Benefits

- **Faster Queries**: Database indexing vs file scanning
- **Concurrent Access**: Multiple users without file locking
- **Data Integrity**: ACID transactions and validation
- **Scalability**: Horizontal scaling capabilities
- **Search**: Full-text search across all story content

## 🔒 Security Enhancements

- **Password Hashing**: Bcrypt with 12 salt rounds
- **Enhanced IP Tracking**: IPv6 support with geolocation
- **Input Validation**: Mongoose schema validation
- **Error Logging**: Comprehensive error tracking
- **User Management**: Secure role-based access control

The application now provides enterprise-level data persistence with enhanced security, performance, and scalability!
