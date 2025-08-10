"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import React, { useState, useEffect, memo } from "react";
import { ButtonCopy } from "../common/button-copy";
import { CodeMirrorEditor as CodeMirrorEditorBase } from "../common/CodeMirror";
import { BracketsCurly, ShareNetwork, X, ArrowsOut } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCodeBlockFullScreen } from "@/app/context/code-block-fullscreen-context";

const CodeMirrorEditor = memo(CodeMirrorEditorBase);

interface CodeBlockCodeProps extends React.HTMLProps<HTMLDivElement> {
  code: string;
  language?: string;
  className?: string;
  status?: "streaming" | "ready" | "submitted" | "error";
  previewLines?: number;
  showPreview?: boolean;
  showHeader?: boolean;
  snippetId?: string;
}

function CodeBlockCode({
  code,
  language = "plaintext",
  className,
  status,
  previewLines = 10,
  showPreview = true,
  showHeader = true,
  snippetId: initialSnippetId,
  ...props
}: CodeBlockCodeProps) {
  const { resolvedTheme: appTheme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snippetId, setSnippetId] = useState(initialSnippetId);
  const { setIsFullScreenCodeBlockOpen } = useCodeBlockFullScreen();
  const currentTheme = appTheme === "dark" ? "dark" : "light";

  const codeLines = code.split("\n");
  const needsPreview = showPreview && codeLines.length > previewLines;
  const previewCode = needsPreview ? codeLines.slice(0, previewLines).join("\n") : code;

  // Otomatis buka fullscreen saat ada kode
  useEffect(() => {
    if (code && code.trim() !== "") {
      setIsModalOpen(true);
    }
  }, [code]);

  // Sinkronkan snippetId dengan initialSnippetId
  useEffect(() => {
    setSnippetId(initialSnippetId);
  }, [initialSnippetId]);

  // Handle escape key dan body overflow
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
    setIsFullScreenCodeBlockOpen(isModalOpen);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
      setIsFullScreenCodeBlockOpen(false);
    };
  }, [isModalOpen, setIsFullScreenCodeBlockOpen]);

  const handleShareCode = async () => {
    if (snippetId) {
      const shareLink = `${window.location.origin}/artifacts/${snippetId}`;
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copied to clipboard!",
        status: "success",
        description: shareLink,
      });
      return;
    }

    try {
      const response = await fetch("/api/code-artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code_content: code,
          language,
          title: `Code Snippet - ${language}`,
          description: "Shared from chat",
          is_public: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to share code snippet.");
      }

      const data = await response.json();
      setSnippetId(data.id);
      const shareLink = `${window.location.origin}/artifacts/${data.id}`;
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Code snippet shared successfully!",
        status: "success",
        description: shareLink,
      });
    } catch (error: any) {
      console.error("Failed to share snippet:", error);
      toast({
        title: "Failed to share code snippet.",
        status: "error",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <>
      <CodeBlock className={cn(className, "relative")}>
        {showHeader && (
          <CodeBlockGroup className="flex h-9 items-center justify-between px-4 rounded-t-xl bg-muted/50">
            <div className="flex gap-1 items-center">
              <span className="text-muted-foreground pr-2 font-mono text-xs">{language}</span>
              {snippetId && (
                <span className="ml-1 text-primary text-xs">
                  ID:{" "}
                  <a
                    href={`/artifacts/${snippetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                    title="View shared snippet"
                  >
                    {snippetId.substring(0, 8)}...
                  </a>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {needsPreview && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  type="button"
                  className={cn(
                    "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium",
                    "transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2",
                    "focus-visible:ring-ring bg-transparent hover:bg-secondary/50 h-8 px-2"
                  )}
                  title="View fullscreen"
                  aria-label="View code in fullscreen mode"
                >
                  <ArrowsOut className="size-3" />
                </button>
              )}
            </div>
          </CodeBlockGroup>
        )}

        {isLoading ? (
          <div className="w-full p-4 rounded-b-xl flex items-center justify-center gap-2 animate-pulse">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <span className="text-muted-foreground text-xs">
              {status === "streaming" ? "Streaming code..." : "Submitting code..."}
            </span>
          </div>
        ) : (
          <div className="relative">
            <div
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                !showHeader && "rounded-t-xl",
                "rounded-b-xl",
                codeLines.length <= previewLines ? "min-h-[60px] max-h-[300px]" : "h-[300px]"
              )}
            >
              <CodeMirrorEditor
                code={needsPreview ? previewCode : code}
                language={language}
                readOnly={true}
                theme={currentTheme}
              />
            </div>
            {needsPreview && (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95 pointer-events-none rounded-b-xl" />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent rounded-b-xl">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
                      "transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2",
                      "focus-visible:ring-ring bg-secondary/80 backdrop-blur-sm hover:bg-secondary text-secondary-foreground h-9 px-4 py-2"
                    )}
                    aria-label="View full code"
                  >
                    <BracketsCurly className="size-4" />
                    View full code ({codeLines.length} lines)
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </CodeBlock>

      {isModalOpen && (
        <div
          className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
            isModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="fixed inset-0 bg-background/95" />
          <div
            className={cn(
              "fixed inset-4 sm:inset-6 md:inset-8 lg:inset-12 max-w-7xl mx-auto",
              "transition-transform duration-300 transform",
              isModalOpen ? "scale-100" : "scale-95"
            )}
          >
            <div className="h-full w-full bg-card border border-border rounded-xl shadow-2xl flex flex-col">
              <div className="flex h-14 items-center justify-between px-6 border-b border-border bg-muted/30 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <BracketsCurly className="size-5 text-muted-foreground" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{language.toUpperCase()} Code</h2>
                    <p className="text-sm text-muted-foreground">
                      {codeLines.length} lines
                      {snippetId && (
                        <span className="ml-2 text-primary">ID: {snippetId.substring(0, 8)}...</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ButtonCopy code={code} />
                  <button
                    onClick={handleShareCode}
                    type="button"
                    className={cn(
                      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
                      "transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2",
                      "focus-visible:ring-ring bg-secondary hover:bg-secondary/80 text-secondary-foreground h-9 px-3"
                    )}
                    aria-label="Share code"
                  >
                    <ShareNetwork className="size-4" />
                    Share
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    type="button"
                    className={cn(
                      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
                      "transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2",
                      "focus-visible:ring-ring bg-secondary hover:bg-secondary/80 text-secondary-foreground h-9 px-3"
                    )}
                    aria-label="Close fullscreen"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden rounded-b-xl">
                <CodeMirrorEditor
                  code={code}
                  language={language}
                  readOnly={true}
                  theme={currentTheme}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CodeBlockProps extends React.HTMLProps<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "not-prose flex w-full flex-col overflow-clip border",
        "border-border bg-card text-card-foreground rounded-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CodeBlockGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

function CodeBlockGroup({ children, className, ...props }: CodeBlockGroupProps) {
  return (
    <div className={cn("flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock };