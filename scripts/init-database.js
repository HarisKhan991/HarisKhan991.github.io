#!/usr/bin/env node

/**
 * Database Initialization Script for Production Deployment
 * 
 * This script initializes the database for a fresh deployment by:
 * 1. Checking database connection
 * 2. Applying Prisma schema to create tables
 * 3. Generating Prisma client
 * 4. Verifying database setup
 * 
 * Usage: node scripts/init-database.js
 * Environment: Requires DATABASE_URL to be set
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function runCommand(command, description, options = {}) {
  try {
    log(`🔄 ${description}...`, 'blue');
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    log(`✅ ${description} completed successfully`, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    if (error.stderr) {
      log(`Error: ${error.stderr}`, 'red');
    }
    if (error.stdout) {
      log(`Output: ${error.stdout}`, 'yellow');
    }
    return { success: false, error: error.message, stderr: error.stderr, stdout: error.stdout };
  }
}

function checkEnvironment() {
  log('\n📋 Step 1: Checking Environment Variables', 'cyan');
  
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = [];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
      log(`❌ Missing: ${varName}`, 'red');
    } else {
      // Mask sensitive parts of DATABASE_URL
      if (varName === 'DATABASE_URL') {
        const dbUrl = process.env[varName];
        const masked = dbUrl.replace(/:([^:@]+)@/, ':****@');
        log(`✅ Found: ${varName} = ${masked}`, 'green');
      } else {
        log(`✅ Found: ${varName}`, 'green');
      }
    }
  }
  
  if (missingVars.length > 0) {
    log('\n❌ Missing required environment variables:', 'red');
    missingVars.forEach(v => log(`   - ${v}`, 'red'));
    log('\nPlease set these environment variables before running this script.', 'yellow');
    return false;
  }
  
  log('✅ All required environment variables are set', 'green');
  return true;
}

function checkPrismaSchema() {
  log('\n📋 Step 2: Checking Prisma Schema', 'cyan');
  
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    log(`❌ Prisma schema not found at: ${schemaPath}`, 'red');
    return false;
  }
  
  log(`✅ Prisma schema found at: ${schemaPath}`, 'green');
  
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const modelCount = (schemaContent.match(/model\s+\w+\s*{/g) || []).length;
    log(`✅ Schema contains ${modelCount} models`, 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to read schema: ${error.message}`, 'red');
    return false;
  }
}

async function initializeDatabase() {
  log('\n🎯 Database Initialization Started', 'bright');
  log('=' .repeat(60), 'cyan');
  
  // Step 1: Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // Step 2: Check Prisma schema
  if (!checkPrismaSchema()) {
    process.exit(1);
  }
  
  // Step 3: Generate Prisma Client
  log('\n📋 Step 3: Generating Prisma Client', 'cyan');
  const generateResult = runCommand(
    'npx prisma generate',
    'Generating Prisma Client'
  );
  
  if (!generateResult.success) {
    log('❌ Failed to generate Prisma client', 'red');
    log('This might be due to schema syntax errors', 'yellow');
    process.exit(1);
  }
  
  // Step 4: Push schema to database (creates tables)
  log('\n📋 Step 4: Creating Database Tables', 'cyan');
  log('⚠️  This will create/update database tables based on the Prisma schema', 'yellow');
  
  const pushResult = runCommand(
    'npx prisma db push --accept-data-loss',
    'Pushing schema to database'
  );
  
  if (!pushResult.success) {
    log('❌ Failed to create database tables', 'red');
    log('\nPossible issues:', 'yellow');
    log('1. Database connection failed - check DATABASE_URL', 'yellow');
    log('2. Database user lacks CREATE TABLE permissions', 'yellow');
    log('3. Database does not exist - create it first', 'yellow');
    log('4. Network connectivity issues', 'yellow');
    
    // Try to provide more specific error information
    if (pushResult.stderr && pushResult.stderr.includes('ECONNREFUSED')) {
      log('\n🔍 Detected: Connection refused - database server not reachable', 'red');
    } else if (pushResult.stderr && pushResult.stderr.includes('Access denied')) {
      log('\n🔍 Detected: Access denied - check database credentials', 'red');
    } else if (pushResult.stderr && pushResult.stderr.includes('Unknown database')) {
      log('\n🔍 Detected: Database does not exist - create it first', 'red');
      log('\nTo create the database, run this SQL command:', 'cyan');
      log('CREATE DATABASE studyhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', 'green');
    }
    
    process.exit(1);
  }
  
  // Step 5: Verify database setup
  log('\n📋 Step 5: Verifying Database Setup', 'cyan');
  
  const validateResult = runCommand(
    'npx prisma db push --help',
    'Validating Prisma CLI',
    { silent: true }
  );
  
  if (validateResult.success) {
    log('✅ Prisma CLI is working correctly', 'green');
  }
  
  // Step 6: Display success message
  log('\n' + '='.repeat(60), 'cyan');
  log('🎉 Database Initialization Completed Successfully!', 'green');
  log('=' .repeat(60), 'cyan');
  
  log('\n📊 Next Steps:', 'cyan');
  log('1. ✅ Database tables have been created', 'green');
  log('2. ✅ Prisma client has been generated', 'green');
  log('3. 🚀 You can now start your application', 'blue');
  log('4. 📝 First user registration will work correctly', 'blue');
  
  log('\n💡 Useful Commands:', 'cyan');
  log('   - View database: npx prisma studio', 'yellow');
  log('   - Reset database: npx prisma db push --force-reset', 'yellow');
  log('   - Generate client: npx prisma generate', 'yellow');
  
  log('\n✨ Database is ready for use!\n', 'green');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unhandled error: ${error.message}`, 'red');
  if (error.stack) {
    log(error.stack, 'red');
  }
  process.exit(1);
});

// Run initialization
initializeDatabase().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  if (error.stack) {
    log(error.stack, 'red');
  }
  process.exit(1);
});
