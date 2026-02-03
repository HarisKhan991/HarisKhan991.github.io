# Database Setup - READ THIS FIRST! 🚀

## 🆘 Quick Fix: Internal Server Error

If you're seeing "Internal Server Error", your database tables haven't been created yet.

### Fix in 3 Steps:

```bash
# 1. Set your database connection
export DATABASE_URL="mysql://root:rootpassword@db:3306/studyhi"

# 2. Initialize database
npm run db:init

# 3. Restart application
npm start
```

**That's it!** Your error should be gone. ✅

---

## 📚 Documentation Files

We've created comprehensive documentation to help you:

### Start Here:
- **[DATABASE-FIX.md](./DATABASE-FIX.md)** - Quick 3-step fix (1.3 KB)
  - Immediate solution to Internal Server Error
  - Common issues and quick fixes
  - Perfect for "just make it work" scenarios

### Full Guide:
- **[DATABASE-SETUP.md](./DATABASE-SETUP.md)** - Complete documentation (6.7 KB)
  - Step-by-step setup instructions
  - Multiple setup options
  - Comprehensive troubleshooting
  - Production deployment guide
  - All error codes explained

---

## 🛠️ Tools Created

### Scripts:
1. **`scripts/init-database.js`** - Automated Node.js setup
   - Environment validation
   - Prisma client generation
   - Database table creation
   - Success verification
   - Helpful error messages

2. **`scripts/setup-database.sh`** - Bash alternative
   - Linux/Mac compatible
   - Simple and fast
   - Color-coded output

### NPM Commands:
```bash
npm run db:init       # Full database initialization
npm run db:setup      # Bash script version
npm run db:push       # Push Prisma schema to database
npm run db:generate   # Generate Prisma client
npm run db:studio     # Open database viewer
npm run db:reset      # Reset database (⚠️ destroys data)
```

### Health Check:
- **Endpoint**: `GET /api/health`
- **Purpose**: Check database status
- **Returns**: Connection status, errors, suggestions

Example:
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "tablesExist": true
  },
  "errors": [],
  "suggestions": [],
  "timestamp": "2026-02-03T22:37:00.000Z"
}
```

---

## 🎯 What Gets Created

When you run `npm run db:init`, it creates **30+ database tables**:

### Core Tables:
- **User Management**: User, UserProfile, UserSettings
- **Academic**: Subject, Chapter, Material
- **Planning**: Task, StudySession, StudyGoal, TestMark
- **Schedule**: CalendarEvent, Notification
- **Organization**: Goal, GoalTask, Skill, SkillObjective
- **Files**: Document, SubjectFile

### Social Features:
- **Community**: Community, CommunityMember, CommunityEvent
- **Communication**: Post, Comment, Like, Message, Channel
- **Networking**: SocialProfile, Follows
- **Dashboard**: DashboardSection

All with proper:
- ✅ Foreign key relationships
- ✅ Indexes for performance
- ✅ Constraints for data integrity
- ✅ Cascading deletes

---

## 🚨 Common Issues

### 1. Database doesn't exist
```
Error: Unknown database 'studyhi'
```

**Solution**:
```sql
CREATE DATABASE studyhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then run `npm run db:init` again.

### 2. Can't connect to MySQL
```
Error: Can't connect to MySQL server
```

**Check**:
- MySQL is running: `systemctl status mysql`
- Port 3306 is open
- DATABASE_URL is correct
- Firewall allows connection

### 3. Access denied
```
Error: Access denied for user
```

**Solution**:
```sql
GRANT ALL PRIVILEGES ON studyhi.* TO 'username'@'%';
FLUSH PRIVILEGES;
```

### 4. Tables already exist
```
Warning: Table already exists
```

**This is OK!** It means your database is already set up. You're good to go!

---

## 🏭 Production Deployment

### First Time Setup:

```bash
#!/bin/bash

# 1. Load environment
export DATABASE_URL="mysql://user:password@host:3306/studyhi"
export NEXTAUTH_URL="https://yourdomain.com"
export NEXTAUTH_SECRET="your-production-secret"

# 2. Install dependencies
npm install

# 3. Initialize database (ONE TIME ONLY)
npm run db:init

# 4. Build application
npm run build

# 5. Start application
npm start
```

### Subsequent Deployments:

```bash
#!/bin/bash

# Skip database initialization if tables already exist
npm install
npm run build
npm start
```

---

## 🔍 Verification

### Check if setup worked:

```bash
# View database
npm run db:studio

# Check health
curl http://localhost:3000/api/health

# Count tables
mysql -u user -p studyhi -e "SHOW TABLES;" | wc -l
# Should show 30+
```

### Test the application:

1. Start the app: `npm start`
2. Open: `http://localhost:3000`
3. Register a new user
4. Login
5. No "Internal Server Error" = Success! ✅

---

## 📖 Need More Help?

1. **Quick Fix**: See [DATABASE-FIX.md](./DATABASE-FIX.md)
2. **Full Guide**: See [DATABASE-SETUP.md](./DATABASE-SETUP.md)
3. **Prisma Docs**: https://www.prisma.io/docs
4. **Health Check**: Visit `/api/health` endpoint

---

## ✨ Summary

**Problem**: Internal Server Error on fresh deployment

**Cause**: Database tables not created

**Solution**: Run `npm run db:init`

**Result**: All 30+ tables created, app works! 🎉

---

**Everything you need is in this repository. Start with DATABASE-FIX.md for the quickest solution!**
