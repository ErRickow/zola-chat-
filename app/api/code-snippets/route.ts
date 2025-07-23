import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Database } from "@/app/types/database.types";

// Tipe untuk payload POST request
interface CreateCodeSnippetPayload {
  code_content: string;
  language: string;
  title?: string;
  description?: string;
  chat_id?: string; // UUID dari chat (opsional)
  is_public: boolean;
}

/**
 * @method POST
 * @summary Menyimpan potongan kode baru ke database.
 * @description
 * Endpoint ini menerima data potongan kode dari frontend dan menyimpannya ke tabel `code_snippets`.
 * Memerlukan autentikasi pengguna dan mengaitkan potongan kode dengan `user_id` yang terautentikasi.
 */
export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      code_content,
      language,
      title,
      description,
      chat_id,
      is_public
    }: CreateCodeSnippetPayload = await request.json();

    if (!code_content || !language) {
      return NextResponse.json(
        { error: "Code content and language are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("code_snippets")
      .insert({
        code_content,
        language,
        title,
        description,
        chat_id: chat_id || null,
        user_id: user.id,
        is_public
      })
      .select("id") // Hanya kembalikan ID yang baru dibuat
      .single();

    if (error) {
      console.error("Error inserting code snippet:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Error parsing request body or internal server error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @method GET
 * @summary Mengambil potongan kode berdasarkan ID.
 * @description
 * Endpoint ini mengambil potongan kode dari database berdasarkan `snippetId` yang diberikan.
 * Menggunakan Row Level Security (RLS) yang telah Anda definisikan di Supabase:
 * - Mengizinkan siapa saja melihat potongan kode jika `is_public` = TRUE.
 * - Mengizinkan pemilik melihat potongan kode mereka sendiri, terlepas dari `is_public`.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const snippetId = searchParams.get("id");

  if (!snippetId) {
    return NextResponse.json(
      { error: "Snippet ID is required." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: snippet, error } = await supabase
    .from("code_snippets")
    .select("*")
    .eq("id", snippetId)
    .single();

  if (error) {
    console.error("Error fetching code snippet:", error);
    // Jika tidak ditemukan atau RLS melarang akses, status 404/403 akan muncul
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (!snippet) {
    return NextResponse.json({ error: "Code snippet not found." }, { status: 404 });
  }

  return NextResponse.json(snippet, { status: 200 });
}