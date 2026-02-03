#!/bin/bash

# Database Setup Script for Production Deployment
# This script sets up the database for first-time deployment

set -e  # Exit on any error

echo "🚀 Database Setup for Production Deployment"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set DATABASE_URL before running this script:"
    echo "export DATABASE_URL='mysql://user:password@host:port/database'"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
echo ""

# Step 1: Generate Prisma Client
echo -e "${BLUE}📋 Step 1: Generating Prisma Client...${NC}"
if npx prisma generate; then
    echo -e "${GREEN}✅ Prisma Client generated successfully${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi
echo ""

# Step 2: Push schema to database (creates all tables)
echo -e "${BLUE}📋 Step 2: Creating Database Tables...${NC}"
echo -e "${YELLOW}⚠️  This will create all tables based on the Prisma schema${NC}"
if npx prisma db push --accept-data-loss; then
    echo -e "${GREEN}✅ Database tables created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create database tables${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Database does not exist - create it first with:"
    echo "   CREATE DATABASE studyhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "2. Database connection failed - check your DATABASE_URL"
    echo "3. Insufficient permissions - ensure database user can CREATE tables"
    exit 1
fi
echo ""

# Success message
echo "==========================================="
echo -e "${GREEN}🎉 Database Setup Completed Successfully!${NC}"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. ✅ Database tables are ready"
echo "2. ✅ Prisma client is generated"
echo "3. 🚀 Start your application"
echo ""
echo "Useful commands:"
echo "  - View database: npx prisma studio"
echo "  - Reset database: npx prisma db push --force-reset"
echo ""
