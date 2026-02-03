# 🚀 Production Database Setup Guide

## Overview

This guide will help you set up the database for your production deployment. The application uses MySQL with Prisma ORM.

## Prerequisites

1. **MySQL Database**: A MySQL 5.7+ or MySQL 8.0+ database server
2. **Database Credentials**: Username, password, host, port, and database name
3. **Node.js**: Version 18 or higher
4. **Environment Variables**: DATABASE_URL must be configured

## Quick Setup (Recommended)

### Option 1: Using the Node.js Script

```bash
# Set your DATABASE_URL
export DATABASE_URL="mysql://user:password@host:3306/studyhi"

# Run the initialization script
node scripts/init-database.js
```

### Option 2: Using the Bash Script

```bash
# Set your DATABASE_URL
export DATABASE_URL="mysql://user:password@host:3306/studyhi"

# Make script executable
chmod +x scripts/setup-database.sh

# Run the script
./scripts/setup-database.sh
```

### Option 3: Manual Setup

```bash
# 1. Set environment variable
export DATABASE_URL="mysql://user:password@host:3306/studyhi"

# 2. Generate Prisma Client
npx prisma generate

# 3. Create database tables
npx prisma db push --accept-data-loss

# 4. Verify setup
npx prisma db push --help
```

## Step-by-Step Guide

### 1. Create the Database

First, create the database on your MySQL server:

```sql
CREATE DATABASE studyhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or using MySQL command line:

```bash
mysql -u root -p -e "CREATE DATABASE studyhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Configure DATABASE_URL

Set the `DATABASE_URL` environment variable with your database credentials:

**Format:**
```
mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

**Example:**
```bash
export DATABASE_URL="mysql://root:rootpassword@db:3306/studyhi"
```

**For production (from your problem statement):**
```bash
export DATABASE_URL="mysql://root:rootpassword@db:3306/studyhi"
```

### 3. Run Database Initialization

Choose one of the methods above to initialize the database.

### 4. Verify Database Setup

Check that tables were created:

```bash
npx prisma studio
```

This will open Prisma Studio where you can view all your database tables.

## Troubleshooting

### Error: "Can't connect to MySQL server"

**Cause**: Database server is not reachable

**Solutions**:
1. Check that MySQL server is running
2. Verify host and port in DATABASE_URL
3. Check firewall rules
4. Verify network connectivity

```bash
# Test connection
mysql -h HOST -P PORT -u USERNAME -p
```

### Error: "Access denied for user"

**Cause**: Invalid credentials or insufficient permissions

**Solutions**:
1. Verify username and password in DATABASE_URL
2. Check that user has CREATE, ALTER, DROP privileges
3. Grant necessary permissions:

```sql
GRANT ALL PRIVILEGES ON studyhi.* TO 'username'@'%';
FLUSH PRIVILEGES;
```

### Error: "Unknown database 'studyhi'"

**Cause**: Database does not exist

**Solution**: Create the database first (see Step 1)

```sql
CREATE DATABASE studyhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Error: "Table already exists"

**Cause**: Database tables already exist

**Solutions**:
1. If this is expected, you're done! Tables are already set up.
2. To reset: `npx prisma db push --force-reset` (⚠️ destroys all data)

### Error: "Prisma schema not found"

**Cause**: Script run from wrong directory

**Solution**: Run from project root where `prisma/schema.prisma` exists

## Database Schema

The application uses the following main tables:

- **User**: User accounts and authentication
- **Subject**: Academic subjects
- **Chapter**: Subject chapters
- **Material**: Learning materials
- **Task**: To-do items and assignments
- **StudySession**: Study tracking
- **TestMark**: Test scores and grades
- **CalendarEvent**: Calendar and scheduling
- **Community**: Social features
- **Post**: User posts
- **Message**: Messaging system

Total: 30+ tables with relationships

## Migration vs. Push

### `prisma db push` (Recommended for initial setup)
- **Use for**: Initial database creation, development
- **Behavior**: Directly modifies database schema
- **Pros**: Fast, simple, no migration history
- **Cons**: No rollback capability

### `prisma migrate deploy` (For production with migrations)
- **Use for**: Production with migration history
- **Behavior**: Applies migration files
- **Pros**: Version control, rollback support
- **Cons**: Requires migration files

For fresh deployment, `prisma db push` is simpler and recommended.

## Production Deployment Checklist

- [ ] MySQL database created
- [ ] DATABASE_URL configured in environment
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database tables created (`npx prisma db push`)
- [ ] Database connection verified
- [ ] First user registration tested
- [ ] Application starts without errors

## Environment Variables

Required for database:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/studyhi

# Authentication (also required)
NEXTAUTH_URL=http://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here

# Optional: OAuth providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Automated Deployment

Add to your deployment script:

```bash
#!/bin/bash

# Load environment variables
source .env.production

# Install dependencies
npm install

# Setup database
node scripts/init-database.js

# Build application
npm run build

# Start application
npm start
```

## Verifying Setup

After running the initialization:

1. **Check Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   Should show all tables without errors

2. **Check table count**:
   ```bash
   mysql -u user -p studyhi -e "SHOW TABLES;" | wc -l
   ```
   Should show 30+ tables

3. **Test application**:
   - Start the application
   - Navigate to registration page
   - Create a test user
   - Login should work without "Internal Server Error"

## Support

If you encounter issues:

1. Check logs for specific error messages
2. Verify all environment variables are set
3. Test database connection independently
4. Review the troubleshooting section above
5. Check Prisma documentation: https://www.prisma.io/docs

## Summary

The "Internal Server Error" you're experiencing is because database tables haven't been created yet. Running the initialization script will:

1. ✅ Generate Prisma Client
2. ✅ Create all 30+ database tables
3. ✅ Verify database connection
4. ✅ Prepare application for first use

**Run this command to fix:**

```bash
export DATABASE_URL="mysql://root:rootpassword@db:3306/studyhi"
node scripts/init-database.js
```

Then restart your application and the "Internal Server Error" should be resolved!
