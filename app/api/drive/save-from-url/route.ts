import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { calculateBufferHash } from '@/lib/drive/file-hash';
import {
    isStorageLimitExceeded,
} from '@/lib/drive/storage';

/**
 * Validate URL to prevent SSRF attacks
 */
function isUrlSafe(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        
        // Only allow HTTP and HTTPS protocols
        if (!['http:', 'https:'].includes(url.protocol)) {
            return false;
        }
        
        // Block private IP ranges
        const hostname = url.hostname.toLowerCase();
        
        // Block localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
            return false;
        }
        
        // Block private IP ranges
        if (
            hostname.startsWith('10.') ||
            hostname.startsWith('192.168.') ||
            hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
        ) {
            return false;
        }
        
        // Block cloud metadata endpoints
        const blockedHosts = [
            '169.254.169.254', // AWS, Azure, GCP metadata
            'metadata.google.internal',
            '169.254.170.2', // AWS ECS metadata
        ];
        
        if (blockedHosts.some(blocked => hostname.includes(blocked))) {
            return false;
        }
        
        return true;
    } catch {
        return false;
    }
}

/**
 * POST /api/drive/save-from-url
 * Save a file from a URL to Drive
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;

        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url, name } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }
        
        // SECURITY: Validate URL to prevent SSRF
        if (!isUrlSafe(url)) {
            return NextResponse.json(
                { error: 'Invalid or unsafe URL' },
                { status: 400 }
            );
        }

        // Get user's drive
        let drive = await prisma.drive.findUnique({
            where: { userId: user.id },
        });

        if (!drive) {
            // Create drive if it doesn't exist
            drive = await prisma.drive.create({
                data: {
                    userId: user.id,
                },
            });
        }

        if (!drive) {
            return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
        }

        // Fetch the file (URL already validated for SSRF)
        const response = await fetch(url, {
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch file from URL' },
                { status: 400 }
            );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileSize = buffer.length;
        
        // SECURITY: Limit file size to prevent DoS (100MB max)
        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        if (fileSize > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large (max 100MB)' },
                { status: 400 }
            );
        }

        // Check storage limit
        if (isStorageLimitExceeded(drive.storageUsed, drive.storageLimit, fileSize)) {
            return NextResponse.json(
                { error: 'Storage limit exceeded' },
                { status: 400 }
            );
        }

        // Calculate file hash for duplicate detection
        const fileHash = calculateBufferHash(buffer, 'md5');

        // Check for duplicate files
        const existingFile = await prisma.driveFile.findFirst({
            where: {
                driveId: drive.id,
                fileHash,
                deletedAt: null,
            },
        });

        if (existingFile) {
            return NextResponse.json(
                { error: 'File already exists in Drive', existingFile },
                { status: 409 }
            );
        }

        // Determine filename and extension
        let filename = name || 'downloaded-file';
        if (!name) {
            // Try to get filename from Content-Disposition header
            const contentDisposition = response.headers.get('content-disposition');
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }
            } else {
                // Try to get from URL (use validated URL, not fetchUrl)
                const urlPath = new URL(url).pathname;
                const basename = path.basename(urlPath);
                if (basename && basename.includes('.')) {
                    filename = basename;
                }
            }
        }

        const fileExt = path.extname(filename) || '';
        const fileType = fileExt.replace('.', '') || 'unknown';
        const mimeType = response.headers.get('content-type') || 'application/octet-stream';

        // Generate storage path
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const uploadDir = path.join(
            process.cwd(),
            'uploads',
            'drives',
            user.id,
            year.toString(),
            month
        );

        // Create directory if it doesn't exist
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const storedName = `${uuidv4()}${fileExt}`;
        const filePath = path.join(uploadDir, storedName);
        const relativeFilePath = path.join(
            'uploads',
            'drives',
            user.id,
            year.toString(),
            month,
            storedName
        );

        // Write file to disk
        await writeFile(filePath, buffer);

        // Create file record in database (root folder)
        const newFile = await prisma.driveFile.create({
            data: {
                driveId: drive.id,
                folderId: null, // Save to root
                originalName: filename,
                storedName,
                fileSize: BigInt(fileSize),
                mimeType,
                fileType,
                fileHash,
                filePath: relativeFilePath,
                isPublic: false,
            },
        });

        // Update storage usage
        await prisma.drive.update({
            where: { id: drive.id },
            data: {
                storageUsed: drive.storageUsed + BigInt(fileSize),
            },
        });

        // Create activity log
        await prisma.driveActivity.create({
            data: {
                driveId: drive.id,
                userId: user.id,
                action: 'upload', // classified as upload/save
                targetType: 'file',
                targetId: newFile.id,
                targetName: filename,
                metadata: JSON.stringify({
                    source: 'feed',
                    sourceUrl: url,
                    fileSize,
                }),
            },
        });

        return NextResponse.json({
            file: {
                ...newFile,
                fileSize: newFile.fileSize.toString(),
            },
            message: 'File saved to Drive successfully',
        }, { status: 201 });

    } catch (error) {
        console.error('Error saving file from URL:', error);
        return NextResponse.json(
            { error: 'Failed to save file to Drive' },
            { status: 500 }
        );
    }
}
