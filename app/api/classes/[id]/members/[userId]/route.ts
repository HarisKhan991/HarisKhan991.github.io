import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/classes/[id]/members/[userId] - Update member role (admin only)
export async function PATCH(
    req: Request,
    { params }: { params: { id: string; userId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: classId, userId: targetUserId } = params;
        const { role } = await req.json();

        if (!role || !['member', 'teacher', 'admin'].includes(role)) {
            return new NextResponse("Invalid role", { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if requesting user is admin or owner
        const classRoom = await prisma.community.findUnique({
            where: { id: classId },
            include: {
                members: {
                    where: { userId: user.id }
                }
            }
        });

        if (!classRoom) {
            return new NextResponse("Class not found", { status: 404 });
        }

        const isOwner = classRoom.ownerId === user.id;
        const isAdmin = classRoom.members.length > 0 && classRoom.members[0].role === 'admin';

        if (!isOwner && !isAdmin) {
            return new NextResponse("Only admins can change member roles", { status: 403 });
        }

        // Update member role
        const updatedMember = await prisma.communityMember.update({
            where: {
                communityId_userId: {
                    communityId: classId,
                    userId: targetUserId
                }
            },
            data: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json(updatedMember);
    } catch (error) {
        console.error("[MEMBER_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE /api/classes/[id]/members/[userId] - Remove member from class (admin only)
export async function DELETE(
    req: Request,
    { params }: { params: { id: string; userId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: classId, userId: targetUserId } = params;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if requesting user is admin or owner
        const classRoom = await prisma.community.findUnique({
            where: { id: classId },
            include: {
                members: {
                    where: { userId: user.id }
                }
            }
        });

        if (!classRoom) {
            return new NextResponse("Class not found", { status: 404 });
        }

        const isOwner = classRoom.ownerId === user.id;
        const isAdmin = classRoom.members.length > 0 && classRoom.members[0].role === 'admin';

        if (!isOwner && !isAdmin) {
            return new NextResponse("Only admins can remove members", { status: 403 });
        }

        // Cannot remove owner
        if (targetUserId === classRoom.ownerId) {
            return new NextResponse("Cannot remove class owner", { status: 400 });
        }

        // Remove member
        await prisma.communityMember.delete({
            where: {
                communityId_userId: {
                    communityId: classId,
                    userId: targetUserId
                }
            }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[MEMBER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
