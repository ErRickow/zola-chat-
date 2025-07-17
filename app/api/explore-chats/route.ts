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
    const { data, error } = await supabase
      .from("chats")
      .select(
        `
        id,
        title,
        created_at,
        model,
        users (
          id,
          display_name,
          profile_image
        )
      `
      )
      .eq("public", true) // Filter hanya obrolan publik
      .order("created_at", { ascending: false }); // Urutkan dari yang terbaru

    if (error) {
      console.error("Error fetching public chats:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Memformat data untuk kemudahan penggunaan di frontend
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
