"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import React, { useState, useEffect } from "react";
import { ButtonCopy } from "../common/button-copy";
import { CodeMirrorEditor } from "../common/CodeMirror";
import { Code, ShareFat, ArrowSquareRight, ArrowsOutSimple } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCodeBlockFullScreen } from "@/app/context/code-block-fullscreen-context";

export type CodeBlockProps = {
  children?: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

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

export type CodeBlockCodeProps = {
  code: string;
  language?: string;
  theme?: string;
  className?: string;
  status?: "streaming" | "ready" | "submitted" | "error";
  previewLines?: number;
  showPreview?: boolean;
  showHeader?: boolean;
  snippetId?: string; // Prop untuk ID potongan kode
} & React.HTMLProps<HTMLDivElement>;

function CodeBlockCode({
  code,
  language = "plaintext",
  className,
  status,
  previewLines = 10,
  showPreview = true,
  showHeader = true,
  snippetId: initialSnippetId, // Gunakan initialSnippetId agar bisa di-state lokal
  ...props
}: CodeBlockCodeProps) {
  const { resolvedTheme: appTheme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snippetId, setSnippetId] = useState(initialSnippetId); // State lokal untuk snippet ID
  const { setIsFullScreenCodeBlockOpen } = useCodeBlockFullScreen(); // Gunakan hook konteks

  const currentTheme = appTheme === "dark" ? "dark" : "light";

  // Hitung apakah kode perlu dipotong untuk preview
  const codeLines = code.split("\n");
  const needsPreview = showPreview && codeLines.length > previewLines;
  const previewCode = needsPreview ? codeLines.slice(0, previewLines).join("\n") : code;

  // Handle escape key untuk menutup modal & Update status global
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  // Prevent body scroll ketika modal open & Update status global untuk chat input
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      setIsFullScreenCodeBlockOpen(true); // Set status global ke true
    } else {
      document.body.style.overflow = "auto";
      setIsFullScreenCodeBlockOpen(false); // Set status global ke false
    }

    return () => {
      document.body.style.overflow = "auto";
      setIsFullScreenCodeBlockOpen(false); // Pastikan false saat unmount
    };
  }, [isModalOpen, setIsFullScreenCodeBlockOpen]);

  const handleShareCode = async () => {
    if (snippetId) {
      // Jika sudah ada snippetId, berarti sudah pernah di-share, langsung copy link
      const shareLink = `${window.location.origin}/snippets/${snippetId}`;
      navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copied to clipboard!",
        status: "success" // Menggunakan status yang sesuai dengan komponen toast Anda
      });
      return;
    }

    // Jika belum ada snippetId, panggil API untuk menyimpannya
    try {
      const response = await fetch("/api/code-snippets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code_content: code,
          language: language,
          title: `Code Snippet - ${language}`, // Judul default
          description: "Shared from chat", // Deskripsi default
          is_public: true // Snippet dibuat publik secara default saat di-share
        })
      });

      if (!response.ok) {
        throw new Error("Failed to share code snippet.");
      }

      const data = await response.json();
      setSnippetId(data.id); // Perbarui state dengan ID baru
      toast({
        title: "Code snippet shared successfully!",
        status: "success"
      });
      const shareLink = `${window.location.origin}/snippets/${data.id}`;
      navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copied to clipboard!",
        status: "success",
        description: shareLink // Jika komponen toast Anda mendukung deskripsi
      });
    } catch (error) {
      console.error("Failed to share snippet:", error);
      toast({
        title: "Failed to share code snippet.",
        status: "error"
      });
    }
  };

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <>
      {/* Code Block Normal */}
      <CodeBlock className={cn(className, "relative")}>
        {/* Header */}
        {showHeader && (
          <CodeBlockGroup className="flex h-9 items-center justify-between px-4 rounded-t-xl bg-muted/50">
            <div className="flex gap-1 items-center">
              {/* Tampilkan bahasa dan ID snippet di header */}
              <span className="text-muted-foreground pr-2 font-mono text-xs">
                {language}
              </span>
              {snippetId && (
                <span className="ml-1 text-primary text-xs">
                  ID:{" "}
                  <a
                    href={`/snippets/${snippetId}`}
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
                  className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring bg-transparent hover:bg-secondary/50 h-8 px-2"
                  title="View fullscreen"
                >
                  <ArrowsOutSimple className="size-3" />
                </button>
              )}
            </div>
          </CodeBlockGroup>
        )}

        {isLoading ? (
          <div className="w-full p-4 rounded-b-xl flex items-center justify-center gap-2">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <div className="relative">
            {/* Container untuk CodeMirror preview */}
            <div
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                !showHeader && "rounded-t-xl",
                "rounded-b-xl h-[300px]"
              )}
            >
              <CodeMirrorEditor
                code={needsPreview ? previewCode : code}
                language={language}
                readOnly={true}
                theme={currentTheme}
              />
            </div>

            {/* Overlay untuk preview mode */}
            {needsPreview && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95 pointer-events-none rounded-b-xl" />
            )}

            {/* Tombol expand untuk preview mode */}
            {needsPreview && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent rounded-b-xl">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring bg-secondary/80 backdrop-blur-sm hover:bg-secondary text-secondary-foreground h-9 px-4 py-2"
                >
                  <Code className="size-4" />
                  View full code ({codeLines.length} lines)
                </button>
              </div>
            )}
          </div>
        )}
      </CodeBlock>

      {/* Modal Fullscreen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-0 bg-background/95" />
          <div className="fixed inset-4 md:inset-8 lg:inset-12">
            <div className="h-full w-full bg-card border border-border rounded-xl shadow-2xl flex flex-col">
              {/* Header Modal */}
              <div className="flex h-14 items-center justify-between px-6 border-b border-border bg-muted/30 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <Code className="size-5 text-muted-foreground" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {language.toUpperCase()} Code
                    </h2>
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
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring bg-secondary hover:bg-secondary/80 text-secondary-foreground h-9 px-3"
                  >
                    <ShareFat className="size-4" />
                    Share
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring bg-secondary hover:bg-secondary/80 text-secondary-foreground h-9 px-3"
                  >
                    <ArrowSquareRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Content Modal */}
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

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>;

function CodeBlockGroup({
  children,
  className,
  ...props
}: CodeBlockGroupProps) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock };