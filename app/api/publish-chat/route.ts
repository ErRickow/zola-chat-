import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json();
    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }
    
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { error } = await supabase
      .from("chats")
      .update({ public: true })
      .eq("id", chatId)
      .eq("user_id", user.id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error publishing chat:", error);
    return NextResponse.json({ error: "Failed to publish chat" }, { status: 500 });
  }
}