import { getSources } from "@/app/components/chat/get-sources"
import { SourcesList } from "@/app/components/chat/sources-list"
import type { Tables } from "@/app/types/database.types"
import { Message, MessageContent } from "@/components/prompt-kit/message"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Message as MessageAISDK } from "@ai-sdk/react"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { Header } from "./header"

// Perbarui tipe MessageType agar mencakup info pengguna
type MessageType = Tables<"messages"> & {
  users?: {
    display_name: string | null
    profile_image: string | null
  } | null
  senderInfo?: {
    id: string | null
    displayName: string | null
    profileImage: string | null
  } | null
}

type ArticleProps = {
  date: string
  title: string
  subtitle: string
  messages: MessageType[]
  publisherInfo?: { 
    display_name: string | null
    profile_image: string | null
  } | null
}

export default function Article({
  date,
  title,
  subtitle,
  messages,
  publisherInfo,
}: ArticleProps) {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-24">
        <div className="mb-8 flex items-center justify-center gap-2 text-sm font-medium">
          <time
            dateTime={new Date(date).toISOString().split("T")[0]}
            className="text-foreground"
          >
            {new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>

        <h1 className="mb-4 text-center text-4xl font-medium tracking-tight md:text-5xl">
          {title}
        </h1>

        <p className="text-foreground mb-8 text-center text-lg">{subtitle}</p>

        <div className="fixed bottom-6 left-0 z-50 flex w-full justify-center">
          <Link href="/">
            <Button
              variant="outline"
              className="text-muted-foreground group flex h-12 w-full max-w-36 items-center justify-between rounded-full py-2 pr-2 pl-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Ask Neosantara AI{" "}
              <div className="rounded-full bg-black/20 p-2 backdrop-blur-sm transition-colors group-hover:bg-black/30">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
            </Button>
          </Link>
        </div>
        <div className="mt-20 w-full">
          {messages.map((message) => {
            const parts = message?.parts as MessageAISDK["parts"]
            const sources = getSources(parts)

            // Menentukan info pengirim untuk pesan user
            const senderInfo = message.role === 'user' ? {
              id: message.user_id,
              displayName: message.users?.display_name,
              profileImage: message.users?.profile_image,
            } : null;

            return (
              <div key={message.id}>
                <Message
                  key={message.id}
                  className={cn(
                    "mb-4 flex flex-col gap-0",
                    message.role === "assistant" && "w-full items-start",
                    message.role === "user" && "w-full items-end"
                  )}
                  variant={message.role}
                  id={message.id}
                  senderInfo={senderInfo}
                >
                  {message.content!}
                </Message>
                {sources && sources.length > 0 && (
                  <SourcesList sources={sources} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
