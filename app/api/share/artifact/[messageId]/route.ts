import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest, // Using NextRequest for consistency
  { params }: { params: { messageId: string } } // Corrected type, removing the Promise wrapper which is likely an error in the other file but we will follow the modern standard.
) {
  const { messageId } = params;
  
  if (!messageId) {
    return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
  }
  
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }
    
    const { data: message, error } = await supabase
      .from("messages")
      .select("*, chats(public)")
      .eq("id", Number(messageId)) // Assuming messageId is a number (SERIAL)
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