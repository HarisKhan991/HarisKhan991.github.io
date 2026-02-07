import { NextRequest, NextResponse } from "next/server"
import { pusherServer } from "@/lib/pusher"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { channel, event, data } = await req.json()
    
    if (!pusherServer) {
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 500 })
    }
    
    // SECURITY: Validate that user can only trigger events for their own channels
    const userId = (session.user as any).id;
    if (!channel.includes(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pusherServer.trigger(channel, event, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Pusher trigger error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
