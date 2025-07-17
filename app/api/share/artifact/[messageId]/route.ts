import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Using the signature that matches your project's established pattern
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> } 
) {
  try {
    const { messageId } = await params;

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // --- CORRECTED LOGIC ---
    // Query 1: Get the message itself
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", Number(messageId))
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    // Query 2: Get the parent chat and check its public status
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("public")
      .eq("id", message.chat_id)
      .single();
      
    if (chatError || !chat) {
        return NextResponse.json({ error: "Parent chat not found" }, { status: 404 });
    }

    // Security check: Only allow access if the parent chat is public.
    if (!chat.public) {
      return NextResponse.json({ error: "This content is not public" }, { status: 403 });
    }
    
    // Return only the message data, as intended.
    return NextResponse.json(message);

  } catch (error) {
    console.error("Error fetching artifact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}