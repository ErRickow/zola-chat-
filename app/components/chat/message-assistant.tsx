"use client"

import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useModel } from "@/lib/model-store/provider"
import {
  ReasoningUIPart,
  SourcesUIPart,
  StepUIPart,
  TextUIPart,
  ToolInvocationUIPart,
  UIPart,
} from "ai"
import { motion } from "framer-motion"
import React, { FC, useMemo } from "react"
import {
  ButtonMessage,
  ButtonMessageEdit,
  ButtonMessageReload,
} from "../common/button-message"
import { CodeBlock } from "../prompt-kit/code-block"
import { Markdown } from "../prompt-kit/markdown"
import { Reasoning } from "./reasoning"
import { SourcesList } from "./sources-list"
import { ToolInvocation } from "./tool-invocation"
import { cn } from "@/lib/utils"
import { Loader } from "../prompt-kit/loader"
import { ArrowBendUpLeftIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type MessageAssistantProps = {
  children?: string
  id?: string
  copied: boolean
  isLast?: boolean
  status?: "streaming" | "ready" | "submitted" | "error"
  parts?: UIPart[]
  onReload?: () => void
  hasScrollAnchor?: boolean
  copyToClipboard: () => void
  className?: string
  attachments?: any[] // Tambahkan baris ini
}

const getComponentForPart = (
  part: UIPart,
  props: { [key: string]: any }
) => {
  switch (part.type) {
    case "text":
      return (
        <Markdown
          content={part.text}
          isStreaming={props.isStreaming}
          markdownProps={{
            components: {
              p: ({ ...pProps }) => (
                <p {...pProps} className="pb-1 last-of-type:pb-0" />
              ),
              pre: ({ ...preProps }) => {
                const language =
                  preProps.children?.[0]?.props?.className?.split(
                    "language-"
                  )[1]
                return (
                  <CodeBlock
                    {...preProps}
                    className="my-3 overflow-x-auto rounded-md"
                    language={language}
                    code={preProps.children?.[0]?.props?.children || ""}
                  />
                )
              },
            },
          }}
        />
      )

    case "tool_invocation":
      return (
        <ToolInvocation
          name={part.toolName}
          args={part.args}
          result={part.result}
        />
      )

    case "sources":
      return <SourcesList {...part} />

    case "reasoning":
      return <Reasoning {...part} />

    default:
      return null
  }
}

export const MessageAssistant: FC<MessageAssistantProps> = ({
  children,
  copied,
  onReload,
  isLast,
  hasScrollAnchor,
  parts,
  status,
  copyToClipboard,
  className,
  attachments, // Terima properti baru
}) => {
  const { preferences } = useUserPreferences()
  const { models } = useModel()

  const shouldRenderTools = useMemo(
    () => preferences.showToolInvocations && models.some((m) => m.tools),
    [preferences.showToolInvocations, models]
  )

  const hasContent = useMemo(() => {
    return (
      (children && children.trim().length > 0) ||
      (parts && parts.length > 0) ||
      (attachments && attachments.length > 0)
    )
  }, [children, parts, attachments])

  // Tambahkan logika untuk menampilkan gambar di sini
  const imageAttachment = attachments?.find(att => att.contentType?.startsWith("image/"))
  if (imageAttachment) {
    return (
      <div className="group min-h-scroll-anchor flex w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2">
        <img src={imageAttachment.url} alt="Generated Image" className="max-w-full rounded-md" />
      </div>
    );
  }

  const getFilteredParts = useMemo(() => {
    if (!parts) return []

    if (shouldRenderTools) {
      return parts
    } else {
      return parts.filter(
        (part) =>
          part.type === "text" ||
          part.type === "reasoning" ||
          part.type === "sources"
      )
    }
  }, [parts, shouldRenderTools])

  if (!hasContent) return null

  const isStreaming = status === "streaming"

  return (
    <div
      id={hasScrollAnchor ? "scroll-anchor" : undefined}
      className={cn(
        "group min-h-scroll-anchor flex w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2",
        className
      )}
    >
      <div className="flex w-full flex-col gap-2">
        {hasContent && (
          <div className="flex w-full flex-col gap-2">
            {getFilteredParts.map((part, index) => (
              <React.Fragment key={index}>
                {getComponentForPart(part, { isStreaming })}
              </React.Fragment>
            ))}
          </div>
        )}

        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader />
          </motion.div>
        )}
      </div>

      <div className="text-muted-foreground -mt-1 flex w-full items-center justify-end gap-1.5 px-0 text-xs opacity-0 transition-opacity group-hover:opacity-100">
        <ButtonMessage
          size="icon"
          variant="ghost"
          aria-label="Copy message to clipboard"
          className={cn("size-7 transition-opacity", copied && "opacity-100")}
          onClick={copyToClipboard}
        >
          {copied ? (
            <CheckIcon className="size-4" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </ButtonMessage>

        {isLast && status !== "streaming" && (
          <ButtonMessageReload onClick={onReload} />
        )}
      </div>
    </div>
  )
}