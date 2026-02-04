import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/database/health-check'

export async function GET(request: NextRequest) {
  try {
    const health = await checkDatabaseHealth()
    
    const status = health.isHealthy ? 200 : 503
    
    return NextResponse.json({
      status: health.isHealthy ? 'healthy' : 'unhealthy',
      database: {
        connected: health.canConnect,
        tablesExist: health.tablesExist
      },
      errors: health.errors,
      suggestions: health.suggestions,
      timestamp: new Date().toISOString()
    }, { status })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
