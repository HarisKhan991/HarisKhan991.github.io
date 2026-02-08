import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/classes/join/[code] - Join a class using invite code
export async function POST(
    req: Request,
    { params }: { params: { code: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { code } = params;

        if (!code) {
            return new NextResponse("Invite code is required", { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Find class by invite code
        const classRoom = await prisma.community.findUnique({
            where: { inviteCode: code },
            include: {
                members: {
                    where: { userId: user.id }
                }
            }
        });

        if (!classRoom) {
            return new NextResponse("Invalid invite code", { status: 404 });
        }

        if (!classRoom.isClass) {
            return new NextResponse("This is not a class", { status: 400 });
        }

        // Check if user is already a member
        if (classRoom.members.length > 0) {
            return new NextResponse("Already a member", { status: 400 });
        }

        // Add user as a member with 'member' role (student)
        await prisma.communityMember.create({
            data: {
                communityId: classRoom.id,
                userId: user.id,
                role: 'member'
            }
        });

        // Get updated class with member info
        const updatedClass = await prisma.community.findUnique({
            where: { id: classRoom.id },
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
                    where: { userId: user.id },
                    select: { role: true }
                }
            }
        });

        return NextResponse.json(updatedClass);
    } catch (error) {
        console.error("[CLASS_JOIN]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
