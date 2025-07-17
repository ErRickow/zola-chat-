import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Using the simplest, most standard signature for a route handler.
export async function GET(
  request: Request, // The first argument is the Request object.
  { params }: { params: { messageId: string } } // The second argument contains params.
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
      .eq("id", Number(messageId)) // Your 'id' column is a number (SERIAL)
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