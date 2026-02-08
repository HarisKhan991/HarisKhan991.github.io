import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/classes/[id]/assignments/[assignmentId]/submissions - Get all submissions (teachers/admins) or own submission (students)
export async function GET(
    req: Request,
    { params }: { params: { id: string; assignmentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: classId, assignmentId } = params;

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

        const isTeacherOrAdmin = ['teacher', 'admin'].includes(member.role);

        let submissions;

        if (isTeacherOrAdmin) {
            // Teachers/admins can see all submissions
            submissions = await prisma.assignmentSubmission.findMany({
                where: { assignmentId },
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    }
                },
                orderBy: {
                    submittedAt: 'desc'
                }
            });
        } else {
            // Students can only see their own submission
            submissions = await prisma.assignmentSubmission.findMany({
                where: {
                    assignmentId,
                    studentId: user.id
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    }
                }
            });
        }

        return NextResponse.json(submissions);
    } catch (error) {
        console.error("[SUBMISSIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/classes/[id]/assignments/[assignmentId]/submissions - Submit or update assignment
export async function POST(
    req: Request,
    { params }: { params: { id: string; assignmentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: classId, assignmentId } = params;
        const { content, attachments, status } = await req.json();

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

        // Check if assignment exists
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId }
        });

        if (!assignment) {
            return new NextResponse("Assignment not found", { status: 404 });
        }

        // Upsert submission
        const submission = await prisma.assignmentSubmission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId: user.id
                }
            },
            create: {
                assignmentId,
                studentId: user.id,
                content,
                attachments: JSON.stringify(attachments || []),
                status: status || 'DRAFT',
                submittedAt: status === 'SUBMITTED' ? new Date() : null
            },
            update: {
                content,
                attachments: JSON.stringify(attachments || []),
                status: status || undefined,
                submittedAt: status === 'SUBMITTED' ? new Date() : undefined
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json(submission);
    } catch (error) {
        console.error("[SUBMISSIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
