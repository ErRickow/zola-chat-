import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// CORRECTED: The signature now matches the working dynamic routes.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> } 
) {
  try {
    // We now `await` the params object because its type is a Promise.
    const { messageId } = await params;

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const { data: message, error } = await supabase
      .from("messages")
      .select("*, chats(public)")
      .eq("id", Number(messageId))
      .single();

    if (error || !message) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    if (!message.chats?.public) {
      return NextResponse.json({ error: "This content is not public" }, { status: 403 });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { chats, ...messageData } = message;

    return NextResponse.json(messageData);
  } catch (error) {
    console.error("Error fetching artifact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}