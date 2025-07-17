"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import React, { useEffect, useState, useMemo } from "react"
import { codeToHtml } from "shiki"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger
} from "@/components/ui/drawer"
import { ButtonCopy } from "../common/button-copy"
import { CodeMirrorEditor } from "../common/CodeMirror"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"

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
} & React.HTMLProps<HTMLDivElement>

function CodeBlockCode({
  code,
  language = "plaintext",
  className,
  ...props
}: CodeBlockCodeProps) {
  const { resolvedTheme: appTheme } = useTheme()
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false); // State untuk mengontrol buka/tutup modal
  const isMobile = useBreakpoint(768); // Deteksi mobile/desktop

  // Determine the theme for Shiki and CodeMirror
  const currentTheme = appTheme === "dark" ? "dark" : "light";

  const extractLanguage = (className?: string): string => {
    if (!className) return "plaintext";
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : "plaintext";
  };

  const MAX_PREVIEW_LINES = 5; // Define max lines for preview

  // Buat kode pratinjau yang terpotong
  const previewCode = useMemo(() => {
    const lines = code.split('\n');
    if (lines.length > MAX_PREVIEW_LINES) {
      return lines.slice(0, MAX_PREVIEW_LINES).join('\n');
    }
    return code;
  }, [code]);

  // Tentukan apakah teks "Click to expand" harus ditampilkan
  const showExpandText = code.split('\n').length > MAX_PREVIEW_LINES;

  useEffect(() => {
    async function highlight() {
      const shikiTheme = currentTheme === "dark" ? "github-dark" : "github-light";
      const html = await codeToHtml(previewCode, {
        lang: language,
        theme: shikiTheme,
      });
      setHighlightedHtml(html);
    }
    highlight();
  }, [previewCode, language, currentTheme]);

  const commonCodeBlockClasses = "w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4 [&>pre]:!bg-background";

  const modalContent = (
    <>
      <div className="flex justify-between items-center bg-secondary p-3 border-b border-border">
        <span className="font-medium">{language} Code</span>
        {/* Tombol close akan disediakan oleh Drawer/Dialog */}
      </div>
      {/* Kontainer untuk CodeMirror agar dapat digulir */}
      <div className="flex-1 overflow-auto">
        <CodeMirrorEditor
          code={code}
          language={language}
          readOnly={true}
          theme={currentTheme}
        />
      </div>
      <div className="flex justify-between items-center bg-secondary p-3 border-t border-border">
        <ButtonCopy code={code} /> {/* Hanya satu tombol salin, di dalam dialog */}
        {/* Anda bisa menambahkan tombol share di sini jika diperlukan */}
        {/* <Button variant="outline" size="sm">Share</Button> */}
      </div>
    </>
  );

  return (
    <CodeBlock className={cn(className, "relative")}>
      <CodeBlockGroup className="flex h-9 items-center justify-between px-4">
        <div className="text-muted-foreground py-1 pr-2 font-mono text-xs">
          {language}
        </div>
      </CodeBlockGroup>

      {isMobile ? (
        <Drawer open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DrawerTrigger asChild>
            <div className="w-full text-left p-0 cursor-pointer" onClick={() => setIsModalOpen(true)}>
              <div
                className={commonCodeBlockClasses}
                dangerouslySetInnerHTML={{ __html: highlightedHtml || `<pre><code>${previewCode}</code></pre>` }}
                {...props}
              />
              {showExpandText && (
                <div className="text-muted-foreground text-center text-xs pt-2 pb-2 hover:underline">
                  Click to view full code
                </div>
              )}
            </div>
          </DrawerTrigger>
          <DrawerContent className="w-full h-dvh max-h-[90vh] flex flex-col rounded-t-lg overflow-hidden">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{language} Code</DrawerTitle>
              <DrawerDescription>View and copy the full code block.</DrawerDescription>
            </DrawerHeader>
            {modalContent}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <div className="w-full text-left p-0 cursor-pointer" onClick={() => setIsModalOpen(true)}>
              <div
                className={commonCodeBlockClasses}
                dangerouslySetInnerHTML={{ __html: highlightedHtml || `<pre><code>${previewCode}</code></pre>` }}
                {...props}
              />
              {showExpandText && (
                <div className="text-muted-foreground text-center text-xs pt-2 pb-2 hover:underline">
                  Click to view full code
                </div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="w-[90vw] h-[80vh] max-w-4xl p-0 flex flex-col rounded-lg overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>{language} Code</DialogTitle>
              <DialogDescription>View and copy the full code block.</DialogDescription>
            </DialogHeader>
            {modalContent}
          </DialogContent>
        </Dialog>
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
