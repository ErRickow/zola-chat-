import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not available in this deployment." },
        { status: 200 }
      );
    }

    // Mengambil obrolan yang public: true dan informasi pengguna terkait
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("chats")
      .select(
        `
        id,
        title,
        created_at,
        model,
        public,
        users (
          id,
          display_name,
          profile_image
        )
      `
      )
      .eq("public", true)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    const publicChats = data.map((chat) => ({
      id: chat.id,
      title: chat.title || "Untitled Chat",
      createdAt: chat.created_at,
      model: chat.model,
      publisher: {
        id: chat.users?.id,
        displayName: chat.users?.display_name,
        profileImage: chat.users?.profile_image,
      },
    }));
    
    return NextResponse.json(publicChats);
  } catch (err: unknown) {
    console.error("Error in /api/explore-chats:", err);
    return new Response(
      JSON.stringify({
        error: (err as Error).message || "Internal server error",
      }),
      { status: 500 }
    );
  }
}
