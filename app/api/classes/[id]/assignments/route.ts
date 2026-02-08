import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to check if user has teacher/admin role in class
async function hasTeacherOrAdminRole(classId: string, userId: string): Promise<boolean> {
    const member = await prisma.communityMember.findUnique({
        where: {
            communityId_userId: {
                communityId: classId,
                userId
            }
        }
    });
    return member ? ['teacher', 'admin'].includes(member.role) : false;
}

// GET /api/classes/[id]/assignments - Get all assignments for a class
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: classId } = params;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is a member of the class
        const member = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: classId,
                    userId: user.id
                }
            }
        });

        if (!member) {
            return new NextResponse("Not a member of this class", { status: 403 });
        }

        // Get assignments
        const assignments = await prisma.assignment.findMany({
            where: {
                communityId: classId,
                isPublished: true
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                _count: {
                    select: { submissions: true }
                },
                // If student, include their submission
                submissions: member.role === 'member' ? {
                    where: { studentId: user.id },
                    select: {
                        id: true,
                        status: true,
                        submittedAt: true,
                        grade: true,
                        gradedAt: true
                    }
                } : false
            },
            orderBy: {
                dueDate: 'asc'
            }
        });

        return NextResponse.json(assignments);
    } catch (error) {
        console.error("[ASSIGNMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/classes/[id]/assignments - Create a new assignment (teachers/admins only)
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: classId } = params;
        const { title, description, dueDate, points, attachments, isPublished } = await req.json();

        if (!title) {
            return new NextResponse("Title is required", { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is teacher or admin
        const hasPermission = await hasTeacherOrAdminRole(classId, user.id);
        if (!hasPermission) {
            return new NextResponse("Only teachers and admins can create assignments", { status: 403 });
        }

        const assignment = await prisma.assignment.create({
            data: {
                communityId: classId,
                creatorId: user.id,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                points,
                // Note: Storing attachments as JSON string for simplicity
                // Consider migrating to a separate Attachment table for production use
                attachments: JSON.stringify(attachments || []),
                isPublished: isPublished || false
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                _count: {
                    select: { submissions: true }
                }
            }
        });

        // If published, create notification for all class members
        if (isPublished) {
            const classMembers = await prisma.communityMember.findMany({
                where: {
                    communityId: classId,
                    userId: { not: user.id }
                },
                select: { userId: true }
            });

            if (classMembers.length > 0) {
                await prisma.notification.createMany({
                    data: classMembers.map(member => ({
                        userId: member.userId,
                        type: 'assignment',
                        title: 'New Assignment',
                        message: `${user.name} posted a new assignment: ${title}`,
                        actionUrl: `/classes/${classId}/assignments/${assignment.id}`
                    }))
                });
            }
        }

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("[ASSIGNMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
