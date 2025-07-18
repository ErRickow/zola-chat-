"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import React, { useState, useMemo } from "react"
import { ButtonCopy } from "../common/button-copy"
import { CodeMirrorEditor } from "../common/CodeMirror"
import { Code, ShareFat, ArrowsInSimple, ArrowsOutSimple } from "@phosphor-icons/react"
import { toast } from "@/components/ui/toast"
import { Skeleton } from "@/components/ui/skeleton"

export type CodeBlockProps = {
    children ? : React.ReactNode
    className ? : string
  } & React.HTMLProps < HTMLDivElement >
  
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
    language ? : string
    theme ? : string
    className ? : string
    status ? : "streaming" | "ready" | "submitted" | "error"
    previewLines ? : number // Jumlah baris yang ditampilkan dalam preview
    showPreview ? : boolean // Apakah menampilkan preview atau langsung full
  } & React.HTMLProps < HTMLDivElement >
  
  function CodeBlockCode({
    code,
    language = "plaintext",
    className,
    status,
    previewLines = 10,
    showPreview = true,
    ...props
  }: CodeBlockCodeProps) {
    const { resolvedTheme: appTheme } = useTheme()
    const [isExpanded, setIsExpanded] = useState(false)
    
    const currentTheme = appTheme === "dark" ? "dark" : "light"
    
    // Hitung apakah kode perlu dipotong untuk preview
    const codeLines = code.split('\n')
    const needsPreview = showPreview && codeLines.length > previewLines
    const previewCode = needsPreview ? codeLines.slice(0, previewLines).join('\n') : code
    
    const handleShareCode = async () => {
      try {
        await navigator.clipboard.writeText(code)
        toast({
          title: "Code copied to clipboard!",
          status: "success",
        })
      } catch (error) {
        console.error("Failed to copy code:", error)
        toast({
          title: "Failed to copy code to clipboard.",
          status: "error",
        })
      }
    }
    
    const isLoading = status === "streaming" || status === "submitted"
    
    // Jika tidak perlu preview atau sudah expanded, tampilkan penuh
    const shouldShowFull = !needsPreview || isExpanded
    
    return (
      <CodeBlock className={cn(className, "relative")}>
      {/* Header dengan info bahasa dan tombol aksi */}
      <CodeBlockGroup className="flex h-9 items-center justify-between px-4 rounded-t-xl bg-muted/50">
        <div className="text-muted-foreground py-1 pr-2 font-mono text-xs uppercase tracking-wide">
          {language}
        </div>
        
        <div className="flex gap-1">
          <ButtonCopy code={code} />
          <button
            onClick={handleShareCode}
            type="button"
            className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring bg-transparent hover:bg-secondary/50 h-8 px-2"
            title="Share code"
          >
            <ShareFat className="size-3" />
          </button>
          
          {needsPreview && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              type="button"
              className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring bg-transparent hover:bg-secondary/50 h-8 px-2"
              title={isExpanded ? "Collapse code" : "Expand code"}
            >
              {isExpanded ? (
                <ArrowsInSimple className="size-3" />
              ) : (
                <ArrowsOutSimple className="size-3" />
              )}
            </button>
          )}
        </div>
      </CodeBlockGroup>

      {isLoading ? (
        <div className="w-full p-4 rounded-b-xl flex items-center justify-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : (
        <div className="relative">
          {/* Container untuk CodeMirror dengan height yang dinamis */}
          <div 
            className={cn(
              "relative overflow-hidden rounded-b-xl transition-all duration-300",
              shouldShowFull 
                ? "max-h-[500px] md:max-h-[700px] lg:max-h-[800px]" 
                : "max-h-[300px]"
            )}
          >
            <CodeMirrorEditor
              code={shouldShowFull ? code : previewCode}
              language={language}
              readOnly={true}
              theme={currentTheme}
            />
          </div>

          {/* Overlay untuk preview mode */}
          {needsPreview && !isExpanded && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95 pointer-events-none rounded-b-xl" />
          )}

          {/* Tombol expand untuk preview mode */}
          {needsPreview && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent rounded-b-xl">
              <button
                onClick={() => setIsExpanded(true)}
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
    )
  }

export type CodeBlockGroupProps = React.HTMLAttributes < HTMLDivElement >
  
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