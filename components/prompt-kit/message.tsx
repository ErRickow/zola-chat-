import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { Message as MessageAISDKType } from "@ai-sdk/react"

const Markdown = dynamic(() => import("./markdown").then((mod) => mod.Markdown))

// Definisi ulang MessageProps untuk komponen Message wrapper
// Ini adalah komponen container yang akan memutuskan merender MessageUser atau MessageAssistant
export type MessageProps = {
  children: React.ReactNode
  className?: string
  // Properti yang akan diteruskan ke MessageUser atau MessageAssistant
  variant: MessageAISDKType["role"] // 'user' atau 'assistant'
  id: string
  attachments?: MessageAISDKType["experimental_attachments"]
  isLast?: boolean
  onDelete?: (id: string) => void
  onEdit?: (id: string, newText: string) => void
  onReload?: () => void
  hasScrollAnchor?: boolean
  parts?: MessageAISDKType["parts"]
  status?: "streaming" | "ready" | "submitted" | "error"
  senderInfo?: {
    id: string | null
    displayName: string | null
    profileImage: string | null
  } | null
} & React.HTMLProps<HTMLDivElement> // Tambahkan HTMLProps untuk props div lainnya


const Message = ({
  children,
  className,
  variant,
  id,
  attachments,
  isLast,
  onDelete,
  onEdit,
  onReload,
  hasScrollAnchor,
  parts,
  status,
  senderInfo,
  ...props // Tangkap props HTML div lainnya
}: MessageProps) => {
  // Komponen Message ini sekarang bertindak sebagai dispatcher
  // Dia tidak merender konten pesan itu sendiri, tetapi meneruskannya ke MessageUser/MessageAssistant
  // Jadi, properti HTML div (seperti onClick, style, dll.) harus diteruskan ke div container di sini
  // atau ke komponen MessageUser/MessageAssistant jika mereka yang menjadi container utama.
  // Untuk kesederhanaan, kita akan meneruskan className dan children ke komponen spesifik.

  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (typeof children === 'string') {
        navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 500);
    }
  }

  if (variant === "user") {
    return (
      <MessageUser
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        onEdit={onEdit}
        onDelete={onDelete}
        id={id}
        hasScrollAnchor={hasScrollAnchor}
        attachments={attachments}
        className={className} // Teruskan className
        senderInfo={senderInfo}
        {...props} // Teruskan props HTML div ke MessageUser
      >
        {children as string}
      </MessageUser>
    )
  }

  if (variant === "assistant") {
    return (
      <MessageAssistant
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        isLast={isLast}
        hasScrollAnchor={hasScrollAnchor}
        parts={parts}
        status={status}
        className={className} // Teruskan className
        {...props} // Teruskan props HTML div ke MessageAssistant
      >
        {children as string}
      </MessageAssistant>
    )
  }

  return null // Atau tampilkan pesan error jika role tidak dikenal
}

export type MessageAvatarProps = {
  src?: string
  alt: string
  fallback?: string
  delayMs?: number
  className?: string
}

const MessageAvatar = ({
  src,
  alt,
  fallback,
  delayMs,
  className,
}: MessageAvatarProps) => {
  return (
    <Avatar className={cn("h-8 w-8 shrink-0", className)}>
      <AvatarImage src={src} alt={alt} />
      {fallback && (
        <AvatarFallback delayMs={delayMs}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  )
}

export type MessageContentProps = {
  children: React.ReactNode
  markdown?: boolean
  className?: string
} & React.ComponentProps<typeof Markdown> &
  React.HTMLProps<HTMLDivElement>

const MessageContent = ({
  children,
  markdown = false,
  className,
  ...props
}: MessageContentProps) => {
  const classNames = cn(
    "rounded-lg p-2 text-foreground bg-secondary prose break-words whitespace-normal",
    className
  )

  return markdown ? (
    <Markdown className={classNames} {...props}>
      {children as string}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}

export type MessageActionsProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLProps<HTMLDivElement>

const MessageActions = ({
  children,
  className,
  ...props
}: MessageActionsProps) => (
  <div
    className={cn("text-muted-foreground flex items-center gap-2", className)}
    {...props}
  >
    {children}
  </div>
)

export type MessageActionProps = {
  className?: string
  tooltip: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
} & React.ComponentProps<typeof Tooltip>

const MessageAction = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}: MessageActionProps) => {
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export { Message, MessageAvatar, MessageContent, MessageActions, MessageAction }
