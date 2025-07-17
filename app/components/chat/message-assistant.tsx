"use client";

import { Message, MessageAction, MessageActions, MessageContent } from "@/components/prompt-kit/message";
import { useUserPreferences } from "@/lib/user-preference-store/provider";
import { cn } from "@/lib/utils";
import type { Message as MessageAISDK, UISticker } from "@ai-sdk/react";
import { ArrowClockwise, Check, Copy } from "@phosphor-icons/react";
import { useChatSession } from "@/lib/chat-store/session/provider";
import { CodeArtifact } from "@/components/common/code-artifact";
import { getSources } from "./get-sources";
import { Reasoning } from "./reasoning";
import { SearchImages } from "./search-images";
import { SourcesList } from "./sources-list";
import { ToolInvocation } from "./tool-invocation";

type MessageAssistantProps = {
  children: string; // The raw markdown content, used for copy-pasting and as a fallback
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
    (part): part is UISticker => part.type === "tool-invocation"
  );
  const searchImageResults =
    parts
    ?.filter(
      (part: any) =>
      part.type === "tool-invocation" &&
      part.toolInvocation?.state === "result" &&
      part.toolInvocation?.toolName === "imageSearch"
    )
    .flatMap((part: any) => part.toolInvocation?.result?.content?.[0]?.results ?? []) ?? [];
  
  const isLastStreaming = status === 'streaming' && isLast;
  
  // This function decides what to render based on the `parts` data.
  const renderContent = () => {
    // Priority 1: If structured `parts` data exists, render it.
    if (parts && Array.isArray(parts) && parts.length > 0) {
      const contentParts = parts.filter(
        (part) => part.type !== "tool-invocation" && part.type !== "source"
      );
      
      return contentParts.map((part: any, index: number) => {
        switch (part.type) {
          case 'text':
            return part.text && part.text.trim() ? (
              <MessageContent key={index} markdown={true} className="w-full bg-transparent p-0">
                {part.text}
              </MessageContent>
            ) : null;
            
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
                isLoading={isLastStreaming}
              />
            );
            
          case 'reasoning':
            return <Reasoning key={index} reasoning={part.reasoning} isStreaming={status === 'streaming'} />;
            
          default:
            return null;
        }
      });
    }
    
    // Priority 2: Fallback to rendering the raw `children` string if `parts` is not available.
    if (children && children.trim() !== "") {
      return <MessageContent markdown={true}>{children}</MessageContent>;
    }
    
    return null;
  };
  
  const hasVisibleContent = (parts && parts.some(p => p.type === 'text' || p.type === 'code_artifact')) || (children && children.trim() !== '');
  
  return (
    <Message
      className={cn("group flex w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2", hasScrollAnchor && "min-h-scroll-anchor", className)}
    >
        {preferences.showToolInvocations && toolInvocationParts && toolInvocationParts.length > 0 && (
          <div className="w-full">
            <ToolInvocation toolInvocations={toolInvocationParts} />
          </div>
        )}

        {searchImageResults.length > 0 && <SearchImages results={searchImageResults} />}
        
        <div className="flex w-full flex-col gap-4">
            {renderContent()}
        </div>

        {sources && sources.length > 0 && <SourcesList sources={sources} />}

        {!isLastStreaming && hasVisibleContent && (
          <MessageActions className="-ml-2 flex gap-0 opacity-0 transition-opacity group-hover:opacity-100">
            <MessageAction tooltip={copied ? "Copied!" : "Copy text"} side="bottom">
              <button className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition" aria-label="Copy text" onClick={copyToClipboard} type="button">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
            </MessageAction>
            {isLast && (
              <MessageAction tooltip="Regenerate" side="bottom" delayDuration={0}>
                <button className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition" aria-label="Regenerate" onClick={onReload} type="button">
                  <ArrowClockwise className="size-4" />
                </button>
              </MessageAction>
            )}
          </MessageActions>
        )}
    </Message>
  );
}