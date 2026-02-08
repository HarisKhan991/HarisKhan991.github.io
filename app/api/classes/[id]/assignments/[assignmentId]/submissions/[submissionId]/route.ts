import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/classes/[id]/assignments/[assignmentId]/submissions/[submissionId] - Grade a submission (teachers/admins only)
export async function PATCH(
    req: Request,
    { params }: { params: { id: string; assignmentId: string; submissionId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: classId, assignmentId, submissionId } = params;
        const { grade, feedback, status } = await req.json();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is teacher or admin
        const member = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: classId,
                    userId: user.id
                }
            }
        });

        if (!member || !['teacher', 'admin'].includes(member.role)) {
            return new NextResponse("Only teachers and admins can grade submissions", { status: 403 });
        }

        // Get the submission to find the student
        const submission = await prisma.assignmentSubmission.findUnique({
            where: { id: submissionId },
            include: {
                assignment: {
                    include: {
                        community: true
                    }
                },
                student: true
            }
        });

        if (!submission) {
            return new NextResponse("Submission not found", { status: 404 });
        }

        // Update submission with grade and feedback
        const updatedSubmission = await prisma.assignmentSubmission.update({
            where: { id: submissionId },
            data: {
                grade,
                feedback,
                status: status || 'GRADED',
                gradedAt: new Date()
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

        // Create notification for the student
        await prisma.notification.create({
            data: {
                userId: submission.studentId,
                type: 'grade',
                title: 'Assignment Graded',
                message: `Your submission for "${submission.assignment.title}" has been graded`,
                actionUrl: `/classes/${classId}/assignments/${assignmentId}`
            }
        });

        return NextResponse.json(updatedSubmission);
    } catch (error) {
        console.error("[SUBMISSION_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
