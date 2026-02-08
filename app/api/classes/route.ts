import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from 'nanoid';

// GET /api/classes - Get user's classes (as owner or member)
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = (session.user as any).id;

        // Get classes where user is owner or member
        const classes = await prisma.community.findMany({
            where: {
                isClass: true,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId } } }
                ]
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                _count: {
                    select: { 
                        members: true,
                        posts: true,
                        assignments: true
                    }
                },
                members: {
                    where: { userId },
                    select: { role: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(classes);
    } catch (error) {
        console.error("[CLASSES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/classes - Create a new class
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { name, description, coverImage, icon } = await req.json();

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Generate unique invite code
        const inviteCode = nanoid(10);

        const classRoom = await prisma.community.create({
            data: {
                name,
                description,
                coverImage,
                icon,
                isClass: true,
                isPrivate: true, // Classes are private by default
                showInSearch: false, // Classes don't appear in search
                inviteCode,
                ownerId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: 'admin' // Creator is admin
                    }
                }
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                _count: {
                    select: { 
                        members: true,
                        posts: true,
                        assignments: true
                    }
                }
            }
        });

        return NextResponse.json(classRoom);
    } catch (error) {
        console.error("[CLASSES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
