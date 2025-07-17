"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import React, { useState, useMemo } from "react"
// Hapus import Dialog dan Drawer
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
// import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer"
import { ButtonCopy } from "../common/button-copy"
import { CodeMirrorEditor } from "../common/CodeMirror"
// import { useBreakpoint } from "@/app/hooks/use-breakpoint" // Tidak perlu lagi useBreakpoint jika tidak ada Drawer/Dialog
import { Code, ShareFat, ArrowsInSimple, ArrowsOutSimple } from "@phosphor-icons/react" // Tambah ikon expand/collapse
import { toast } from "@/components/ui/toast"
import { Skeleton } from "@/components/ui/skeleton"

export type CodeBlockProps = {
  children?: React.ReactNode
  className?: string
} & React.HTMLProps<HTMLDivElement>

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
  )
}

export type CodeBlockCodeProps = {
  code: string
  language?: string
  theme?: string
  className?: string
  status?: "streaming" | "ready" | "submitted" | "error";
} & React.HTMLProps<HTMLDivElement>

function CodeBlockCode({
  code,
  language = "plaintext",
  className,
  status,
  ...props
}: CodeBlockCodeProps) {
  const { resolvedTheme: appTheme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false);

  const currentTheme = appTheme === "dark" ? "dark" : "light";

  const extractLanguage = (className?: string): string => {
    if (!className) return "plaintext";
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : "plaintext";
  };

  const handleShareCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied to clipboard!",
        status: "success",
      });
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast({
        title: "Failed to copy code to clipboard.",
        status: "error",
      });
    }
  };

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <CodeBlock className={cn(className, "relative")}>
      <CodeBlockGroup className="flex h-9 items-center justify-between px-4 rounded-t-xl">
        <div className="text-muted-foreground py-1 pr-2 font-mono text-xs">
          {language}
        </div>
        {/* Tombol aksi di header */}
        <div className="flex gap-2">
          {isExpanded && (
            <>
              <ButtonCopy code={code} />
              <button
                onClick={handleShareCode}
                type="button"
                className="ml-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 dark:border-none h-9 px-4 py-2 has-[>svg]:px-3"
              >
                <ShareFat className="size-4" />
                Share
              </button>
            </>
          )}
          {/* Tombol Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            className="ml-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 dark:border-none h-9 px-4 py-2 has-[>svg]:px-3"
          >
            {isExpanded ? (
              <>
                <ArrowsInSimple className="size-4" />
                Collapse
              </>
            ) : (
              <>
                <ArrowsOutSimple className="size-4" />
                Expand
              </>
            )}
          </button>
        </div>
      </CodeBlockGroup>

      {isLoading ? (
        <div className="cursor-default w-full text-left p-4 rounded-b-xl flex items-center justify-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : (
        <>
          {!isExpanded ? (
            <div
              className="cursor-pointer w-full text-left p-4 rounded-b-xl hover:bg-accent/50 transition-colors flex items-center justify-center gap-2"
              onClick={() => setIsExpanded(true)} // Klik untuk expand
              {...props}
            >
              <Code className="size-5 text-muted-foreground" />
              <span className="font-medium text-foreground">View {language} Code</span>
            </div>
          ) : (
            // Tampilan CodeMirror penuh saat expanded
            <div className="relative flex-1 overflow-y-auto max-h-[500px] md:max-h-[700px] lg:max-h-[800px] rounded-b-xl"> {/* Max height agar bisa scroll */}
              <CodeMirrorEditor
                code={code}
                language={language}
                readOnly={true}
                theme={currentTheme}
              />
            </div>
          )}
        </>
      )}
    </CodeBlock>
  );
}

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>

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
  )
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock }
