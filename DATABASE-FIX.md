# 🆘 QUICK FIX: Internal Server Error - Database Not Created

## The Problem
You're getting "Internal Server Error" because the database tables haven't been created yet.

## The Solution (3 Steps)

### Step 1: Set Environment Variable
```bash
export DATABASE_URL="mysql://root:rootpassword@db:3306/studyhi"
```

### Step 2: Run Database Setup
**Option A - Simple (Recommended):**
```bash
npm run db:init
```

**Option B - Manual:**
```bash
npx prisma generate
npx prisma db push --accept-data-loss
```

### Step 3: Restart Application
```bash
npm run build
npm start
```

## That's It!
The "Internal Server Error" should be gone. Your database now has all 30+ tables needed.

## Verify It Worked
```bash
# View your database
npm run db:studio
```

## Common Issues

### "Database 'studyhi' doesn't exist"
Create it first:
```bash
mysql -u root -p -e "CREATE DATABASE studyhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### "Can't connect to MySQL"
- Check DATABASE_URL is correct
- Make sure MySQL is running
- Check firewall/network

### "Access denied"
- Verify username/password
- Grant permissions:
```sql
GRANT ALL PRIVILEGES ON studyhi.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

## Need More Help?
See detailed guide: [DATABASE-SETUP.md](./DATABASE-SETUP.md)

---

**TL;DR:** Run `npm run db:init` and restart your app!
