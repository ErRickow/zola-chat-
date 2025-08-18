"use client"

import { Message as MessageType } from "@ai-sdk/react"
import React, { useState } from "react"
import { MessageAssistant } from "./message-assistant"
import { MessageUser } from "./message-user"

type MessageProps = {
  variant: MessageType["role"]
  children: string
  id: string
  attachments ? : MessageType["experimental_attachments"]
  isLast ? : boolean
  onDelete ? : (id: string) => void
  onEdit ? : (id: string, newText: string) => void
  onReload ? : () => void
  hasScrollAnchor ? : boolean
  parts ? : MessageType["parts"]
  status ? : "streaming" | "ready" | "submitted" | "error"
  className ? : string
  senderInfo ? : {
    id: string | null
    displayName: string | null
    profileImage: string | null
  } | null
}

export function Message({
  variant,
  children,
  id,
  attachments,
  isLast,
  onDelete,
  onEdit,
  onReload,
  hasScrollAnchor,
  parts,
  status,
  className,
  senderInfo,
}: MessageProps) {
  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 500)
  }
  
  // Tambahkan ? prevent undefined 
  const imageAttachment = attachments?.find(att => att.contentType?.startsWith("image/"))
  if (imageAttachment) {
    return (
      <div className="group min-h-scroll-anchor flex w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2">
        <img src={imageAttachment.url} alt="Generated Image" className="max-w-full rounded-md" />
      </div>
    );
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
        className={className}
        senderInfo={senderInfo}
      >
        {children}
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
        className={className}
      >
        {children}
      </MessageAssistant>
    )
  }
  
  return null
}