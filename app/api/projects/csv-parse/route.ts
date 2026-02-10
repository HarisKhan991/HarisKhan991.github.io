import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { csvParser } from '@/lib/projects/csvParser';

/**
 * POST /api/projects/csv-parse
 * Parse CSV data and return structured project sections
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.csv || typeof body.csv !== 'string') {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 });
    }

    // Validate CSV first
    const validation = csvParser.validateCSV(body.csv);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid CSV format', errors: validation.errors },
        { status: 400 }
      );
    }

    // Parse CSV
    const sections = csvParser.parseProjectCSV(body.csv);

    return NextResponse.json({ sections });
  } catch (error: any) {
    console.error('Error parsing CSV:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse CSV' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/csv-parse
 * Get CSV template
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = csvParser.generateTemplate();

    return new NextResponse(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=project-template.csv',
      },
    });
  } catch (error: any) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}
