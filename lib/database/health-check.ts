/**
 * Database Health Check Utility
 * 
 * This utility checks if the database is properly set up and provides
 * helpful error messages if there are issues.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface DatabaseHealthCheck {
  isHealthy: boolean
  tablesExist: boolean
  canConnect: boolean
  errors: string[]
  suggestions: string[]
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  const result: DatabaseHealthCheck = {
    isHealthy: false,
    tablesExist: false,
    canConnect: false,
    errors: [],
    suggestions: []
  }

  try {
    // Test 1: Can we connect?
    await prisma.$connect()
    result.canConnect = true

    // Test 2: Do tables exist?
    try {
      // Try to count users - if this works, tables exist
      await prisma.user.count()
      result.tablesExist = true
      result.isHealthy = true
    } catch (error: any) {
      result.tablesExist = false
      
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        result.errors.push('Database tables have not been created')
        result.suggestions.push('Run: npm run db:init')
        result.suggestions.push('Or: npx prisma db push')
      } else {
        result.errors.push(`Table access error: ${error.message}`)
        result.suggestions.push('Check database permissions')
      }
    }
  } catch (error: any) {
    result.canConnect = false
    
    if (error.code === 'P1001') {
      result.errors.push('Cannot reach database server')
      result.suggestions.push('Check if MySQL server is running')
      result.suggestions.push('Verify DATABASE_URL is correct')
      result.suggestions.push('Check network/firewall settings')
    } else if (error.code === 'P1002') {
      result.errors.push('Database connection timeout')
      result.suggestions.push('Check if database server is responsive')
      result.suggestions.push('Verify network connectivity')
    } else if (error.code === 'P1003') {
      result.errors.push('Database does not exist')
      result.suggestions.push('Create database: CREATE DATABASE studyhi;')
      result.suggestions.push('Then run: npm run db:init')
    } else if (error.code === 'P1008') {
      result.errors.push('Database operation timeout')
      result.suggestions.push('Check database server performance')
    } else if (error.code === 'P1009' || error.code === 'P1010') {
      result.errors.push('Access denied to database')
      result.suggestions.push('Check database username and password')
      result.suggestions.push('Grant permissions to database user')
    } else {
      result.errors.push(`Database error: ${error.message}`)
      result.suggestions.push('Check DATABASE_URL environment variable')
      result.suggestions.push('See DATABASE-SETUP.md for help')
    }
  } finally {
    await prisma.$disconnect()
  }

  return result
}

export async function ensureDatabaseReady(): Promise<void> {
  const health = await checkDatabaseHealth()
  
  if (!health.isHealthy) {
    const errorMessage = [
      '❌ Database is not ready!',
      '',
      'Errors:',
      ...health.errors.map(e => `  - ${e}`),
      '',
      'Suggestions:',
      ...health.suggestions.map(s => `  ✓ ${s}`),
      '',
      'For detailed help, see: DATABASE-SETUP.md'
    ].join('\n')
    
    throw new Error(errorMessage)
  }
}

export function createDatabaseHealthEndpoint() {
  return async function healthCheckHandler(req: any, res: any) {
    try {
      const health = await checkDatabaseHealth()
      
      const status = health.isHealthy ? 200 : 503
      
      return res.status(status).json({
        status: health.isHealthy ? 'healthy' : 'unhealthy',
        database: {
          connected: health.canConnect,
          tablesExist: health.tablesExist
        },
        errors: health.errors,
        suggestions: health.suggestions,
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }
}
