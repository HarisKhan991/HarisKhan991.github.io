import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Allowed MIME types for uploads
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
    try {
        // SECURITY: Require authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const subfolder = formData.get("subfolder") as string || "";

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // SECURITY: Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "File type not allowed" },
                { status: 400 }
            );
        }

        // SECURITY: Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large (max 10MB)" },
                { status: 400 }
            );
        }

        // SECURITY: Properly sanitize subfolder to prevent path traversal
        // Use path.normalize and verify it stays within uploads directory
        const baseUploadDir = path.join(process.cwd(), "public", "uploads");
        const requestedSubfolder = path.normalize(subfolder.replace(/^[/\\]+/, ''));
        const targetDir = path.join(baseUploadDir, requestedSubfolder);
        
        // Ensure the resolved path is still within the uploads directory
        if (!targetDir.startsWith(baseUploadDir)) {
            return NextResponse.json(
                { error: "Invalid upload path" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}${path.extname(file.name)}`;
        const filePath = path.join(targetDir, filename);

        await mkdir(targetDir, { recursive: true });
        await writeFile(filePath, buffer);

        const relativePath = requestedSubfolder
            ? `/uploads/${requestedSubfolder}/${filename}`.replace(/\/+/g, "/")
            : `/uploads/${filename}`;

        return NextResponse.json({ url: relativePath });
    } catch (error) {
        console.error("[UPLOAD_ERROR]", error);
        return NextResponse.json(
            { error: "Error saving file" },
            { status: 500 }
        );
    }
}
