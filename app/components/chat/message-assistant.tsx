"use client";

import { Message, MessageAction, MessageActions, MessageContent } from "@/components/prompt-kit/message";
import { useUserPreferences } from "@/lib/user-preference-store/provider";
import { cn } from "@/lib/utils";
import type { Message as MessageAISDK } from "@ai-sdk/react";
import type { ToolInvocationUIPart } from "@ai-sdk/ui-utils"; // CORRECTED: Import the correct type
import { ArrowClockwise, Check, Copy } from "@phosphor-icons/react";
import { useChatSession } from "@/lib/chat-store/session/provider";
import { CodeArtifact } from "@/components/common/code-artifact";
import { getSources } from "./get-sources";
import { Reasoning } from "./reasoning";
import { SourcesList } from "./sources-list";
import { ToolInvocation } from "./tool-invocation";

// Helper function to parse code blocks from raw markdown
const parseCodeBlock = (markdown: string) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/;
  const match = markdown.match(codeBlockRegex);

  if (match) {
    const language = match[1] || 'plaintext';
    const code = match[2].trim();
    // Check if there is any text other than the code block
    const surroundingText = markdown.replace(codeBlockRegex, '').trim();
    return {
      isCodeOnly: surroundingText.length === 0,
      language,
      code,
      title: `Generated ${language.charAt(0).toUpperCase() + language.slice(1)} Snippet`
    };
  }
  return null;
};

type MessageAssistantProps = {
  children: string; // This is the raw markdown content
  id: string;
  isLast?: boolean;
  hasScrollAnchor?: boolean;
  copied?: boolean;
  copyToClipboard?: () => void;
  onReload?: () => void;
  parts?: MessageAISDK["parts"];
  status?: "streaming" | "ready" | "submitted" | "error";
  className?: string;
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
    (part): part is ToolInvocationUIPart => part.type === "tool-invocation"
  );
  
  const isLastStreaming = status === 'streaming' && isLast;
  const codeBlockInfo = parseCodeBlock(children);

  return (
    <Message
      className={cn("group flex w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2", hasScrollAnchor && "min-h-scroll-anchor", className)}
    >
      {/* Render tools and other non-text parts first */}
      {preferences.showToolInvocations && toolInvocationParts && toolInvocationParts.length > 0 && (
        <div className="w-full">
          <ToolInvocation toolInvocations={toolInvocationParts} />
        </div>
      )}

      {/* Conditional Rendering: CodeArtifact or simple Markdown */}
      <div className="flex w-full flex-col gap-4">
        {codeBlockInfo?.isCodeOnly ? (
          <CodeArtifact
            messageId={messageId}
            chatId={chatId!}
            documentId={`code-artifact-${messageId}`}
            title={codeBlockInfo.title}
            language={codeBlockInfo.language}
            code={codeBlockInfo.code}
            isLoading={isLastStreaming}
          />
        ) : (
          <MessageContent markdown={true}>{children}</MessageContent>
        )}
      </div>

      {sources && sources.length > 0 && <SourcesList sources={sources} />}

      {!isLastStreaming && children.trim() && (
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