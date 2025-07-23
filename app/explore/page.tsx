"use client"

import { LayoutApp } from "@/app/components/layout/layout-app"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatCircle, CalendarBlank } from "@phosphor-icons/react"
import { formatDate } from "@/app/components/history/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { notFound } from "next/navigation"
import { CodeBlockFullScreenProvider } from "@/app/context/code-block-fullscreen-context";

type PublicChat = {
  id: string
  title: string
  createdAt: string
  model: string | null
  publisher: {
    id: string | null
    displayName: string | null
    profileImage: string | null
  } | null
}

export default function ExplorePage() {
  if (!isSupabaseEnabled) {
    return notFound()
  }
  
  const { data: publicChats, isLoading, error } = useQuery<PublicChat[]>({
    queryKey: ["public-chats"],
    queryFn: async () => {
      const response = await fetch("/api/explore-chats")
      if (!response.ok) {
        throw new Error("Failed to fetch public chats")
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  if (error) {
    return (
      <LayoutApp>
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center text-red-500">
            Error loading public chats: {error.message}
          </div>
        </div>
      </LayoutApp>
    )
  }

  return (
    <CodeBlockFullScreenProvider>
    <LayoutApp>
      <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-medium tracking-tight text-center mb-10">
          Explore Public Chats
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="py-4 px-4">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : publicChats && publicChats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicChats.map((chat) => (
              <Link key={chat.id} href={`/share/${chat.id}`} prefetch>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer py-4 px-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {chat.title}
                    </CardTitle>
                    <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                      <CalendarBlank className="size-3.5" />
                      {formatDate(chat.createdAt)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={chat.publisher?.profileImage || undefined} />
                        <AvatarFallback>
                          {chat.publisher?.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {chat.publisher?.displayName || "Anonymous"}
                      </span>
                    </div>
                    {chat.model && (
                      <div className="text-muted-foreground text-xs mt-2 flex items-center gap-1">
                        <ChatCircle className="size-3.5" />
                        Model: {chat.model}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center py-20">
            <div className="text-center text-muted-foreground">
              <h2 className="text-xl font-medium mb-2">No Public Chats Yet</h2>
              <p>Be the first to publish a conversation!</p>
            </div>
          </div>
        )}
      </div>
    </LayoutApp>
    </CodeBlockFullScreenProvider>
  )
}
