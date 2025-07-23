import { APP_DOMAIN } from "@/lib/config"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Article from "./article"
import { Skeleton } from "@/components/ui/skeleton"
import { CodeBlockFullScreenProvider } from "@/app/context/code-block-fullscreen-context";
import React from "react"

export const dynamic = "force-static"

// Perbaiki tipe untuk params: langsung objek, bukan Promise
export async function generateMetadata({
  params,
}: {
  params: Promise<{ chatId: string }>
}): Promise<Metadata> {
  if (!isSupabaseEnabled) {
    return notFound()
  }

  const { chatId } = await params
  const supabase = await createClient()

  if (!supabase) {
    return notFound()
  }

  const { data: chat } = await supabase
    .from("chats")
    .select("title, created_at")
    .eq("id", chatId)
    .single()

  const title = chat?.title || "Chat"
  const description = "A chat in Neosantara"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${APP_DOMAIN}/share/${chatId}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

// Komponen untuk menampilkan skeleton loading
function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-24">
      <Skeleton className="h-8 w-1/4 mx-auto mb-8" /> {/* Tanggal */}
      <Skeleton className="h-12 w-3/4 mx-auto mb-4" /> {/* Judul */}
      <Skeleton className="h-6 w-1/2 mx-auto mb-8" /> {/* Subtitle */}

      <div className="space-y-8">
        {/* Skeleton untuk pesan user */}
        <div className="flex justify-end items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-20 w-3/4 rounded-lg" />
        </div>
        {/* Skeleton untuk pesan assistant */}
        <div className="flex justify-start items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
        <div className="flex justify-end items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-20 w-3/4 rounded-lg" />
        </div>
        <div className="flex justify-start items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default async function ShareChat({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  if (!isSupabaseEnabled) {
    return notFound()
  }

  const { chatId } = await params 
  const supabase = await createClient()

  if (!supabase) {
    return notFound()
  }

  // Mengambil data chat
  const { data: chatData, error: chatError } = await supabase
    .from("chats")
    .select("id, title, created_at, users(display_name, profile_image)") // Mengambil info publisher
    .eq("id", chatId)
    .single()

  if (chatError || !chatData) {
    redirect("/")
  }

  // Mengambil data pesan, termasuk info pengirim (user_id dan join ke tabel users)
  const { data: messagesData, error: messagesError } = await supabase
    .from("messages")
    .select("*, users(display_name, profile_image)") // Mengambil info pengirim pesan
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })

  if (messagesError || !messagesData) {
    redirect("/")
  }

  // Memformat pesan agar sesuai dengan tipe yang diharapkan oleh komponen MessageUser/MessageAssistant
  const formattedMessages = messagesData.map(msg => ({
    ...msg,
    id: msg.id, // Pastikan ID adalah string
    createdAt: new Date(msg.created_at || ""),
    content: msg.content || "",
    // Tambahkan properti pengirim untuk pesan user
    senderInfo: msg.role === 'user' ? {
      id: msg.user_id,
      displayName: msg.users?.display_name,
      profileImage: msg.users?.profile_image,
    } : null,
  }));


  // Menggunakan Promise.all untuk mensimulasikan loading asinkron
  // Ini akan memastikan skeleton terlihat saat data sedang diambil
  await new Promise(resolve => setTimeout(resolve, 3000));

  return (
    <CodeBlockFullScreenProvider>
    <React.Suspense fallback={<LoadingSkeleton />}>
      <Article
        id={chatData.id}
        messages={formattedMessages}
        date={chatData.created_at || ""}
        title={chatData.title || ""}
        subtitle={"A conversation in Neosantara"}
        publisherInfo={chatData.users}
      />
    </React.Suspense>
    </CodeBlockFullScreenProvider>
  )
}
