"use client";

import { Message, MessageContent, MessageAction, MessageActions } from "@/components/prompt-kit/message";
import { useUserPreferences } from "@/lib/user-preference-store/provider";
import { cn } from "@/lib/utils";
import type { Message as MessageAISDK } from "@ai-sdk/react";
import { ArrowClockwise, Check, Copy } from "@phosphor-icons/react";
import { useChatSession } from "@/lib/chat-store/session/provider";
import { getSources } from "./get-sources";
import { Reasoning } from "./reasoning";
import { SearchImages } from "./search-images";
import { SourcesList } from "./sources-list";
import { ToolInvocation } from "./tool-invocation";
import { CodeArtifact } from "@components/common/code-artifact"; 

type MessageAssistantProps = {
  children: string;
  id: string;
  isLast ? : boolean;
  hasScrollAnchor ? : boolean;
  copied ? : boolean;
  copyToClipboard ? : () => void;
  onReload ? : () => void;
  parts ? : MessageAISDK["parts"];
  status ? : "streaming" | "ready" | "submitted" | "error";
  className ? : string;
};

export function MessageAssistant({
  children,
  id: messageId,
  isLast,
  hasScrollAnchor,
  copied,
  copyToClipboard,
  onReload,
  parts,
  status,
  className,
}: MessageAssistantProps) {
  const { preferences } = useUserPreferences();
  const { chatId } = useChatSession();
  
  const sources = getSources(parts);
  const toolInvocationParts = parts?.filter(
    (part) => part.type === "tool-invocation"
  );
  const searchImageResults =
    parts
    ?.filter(
      (part) =>
      part.type === "tool-invocation" &&
      part.toolInvocation?.state === "result" &&
      part.toolInvocation?.toolName === "imageSearch" &&
      part.toolInvocation?.result?.content?.[0]?.type === "images"
    )
    .flatMap((part) =>
      part.type === "tool-invocation" &&
      part.toolInvocation?.state === "result" &&
      part.toolInvocation?.toolName === "imageSearch" &&
      part.toolInvocation?.result?.content?.[0]?.type === "images" ?
      (part.toolInvocation?.result?.content?.[0]?.results ?? []) :
      []
    ) ?? [];
  
  const hasContent = (parts && parts.length > 0) || (children && children.trim() !== "");
  const isLastStreaming = status === 'streaming' && isLast;
  
  const renderContent = () => {
    // If structured parts exist, render them accordingly
    if (parts && Array.isArray(parts) && parts.length > 0) {
      // Filter out tool invocations to be rendered separately by the ToolInvocation component
      const contentParts = parts.filter(part => part.type !== 'tool-invocation');
      
      return contentParts.map((part: any, index: number) => {
        switch (part.type) {
          case 'text':
            return <MessageContent key={index} markdown={true} className="bg-transparent p-0">{part.text}</MessageContent>;
            
          case 'code_artifact':
            return (
              <CodeArtifact
                key={index}
                messageId={messageId}
                chatId={chatId!}
                documentId={part.documentId}
                title={part.title}
                language={part.language}
                code={part.code}
                isLoading={status === 'streaming' && isLast}
              />
            );
            
          case 'reasoning':
            return <Reasoning key={index} reasoning={part.reasoning} isStreaming={status === 'streaming'} />;
            
            {/** @TODO future functions **/}
          default:
            return null;
        }
      });
    }
    
    // Fallback for simple string content
    if (children && children.trim() !== "") {
      return (
        <MessageContent
          markdown={true}
          className="prose dark:prose-invert relative min-w-full bg-transparent p-0"
        >
          {children}
        </MessageContent>
      );
    }
    
    return null;
  };
  
  return (
    <Message
      className={cn(
        "group flex w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2",
        hasScrollAnchor && "min-h-scroll-anchor",
        className
      )}
    >
      <div className={cn("flex min-w-full flex-col gap-4", isLast && "pb-8")}>
        {preferences.showToolInvocations && toolInvocationParts && toolInvocationParts.length > 0 && (
          <ToolInvocation toolInvocations={toolInvocationParts} />
        )}

        {searchImageResults.length > 0 && (
          <SearchImages results={searchImageResults} />
        )}

        {renderContent()}

        {sources && sources.length > 0 && <SourcesList sources={sources} />}

        {!isLastStreaming && hasContent && (
          <MessageActions className="-ml-2 flex gap-0 opacity-0 transition-opacity group-hover:opacity-100">
            <MessageAction tooltip={copied ? "Copied!" : "Copy text"} side="bottom">
              <button
                className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition"
                aria-label="Copy text"
                onClick={copyToClipboard}
                type="button"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
            </MessageAction>
            {isLast && (
              <MessageAction tooltip="Regenerate" side="bottom" delayDuration={0}>
                <button
                  className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition"
                  aria-label="Regenerate"
                  onClick={onReload}
                  type="button"
                >
                  <ArrowClockwise className="size-4" />
                </button>
              </MessageAction>
            )}
          </MessageActions>
        )}
      </div>
    </Message>
  );
}