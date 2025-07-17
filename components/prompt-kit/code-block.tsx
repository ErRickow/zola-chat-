"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import React, { useState, useMemo } from "react"
// import { codeToHtml } from "shiki" // Shiki tidak lagi digunakan untuk pratinjau
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ButtonCopy } from "../common/button-copy"
import { CodeMirrorEditor } from "../common/CodeMirror"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { Code, ShareFat } from "@phosphor-icons/react"
import { toast } from "@/components/ui/toast"

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
  // Tambahkan status untuk indikator loading (jika akan diimplementasikan)
  // status?: "streaming" | "ready" | "submitted" | "error";
} & React.HTMLProps<HTMLDivElement>

function CodeBlockCode({
  code,
  language = "plaintext",
  className,
  // status, // Terima status jika diperlukan
  ...props
}: CodeBlockCodeProps) {
  const { resolvedTheme: appTheme } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useBreakpoint(768);

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

  // Konten modal CodeMirror (akan sama untuk Drawer dan Dialog)
  const modalContent = (
    <>
      <div className="flex justify-between items-center bg-secondary p-3 border-b border-border flex-shrink-0"> {/* Tambah flex-shrink-0 */}
        <span className="font-medium">{language} Code</span>
      </div>
      {/* Kontainer untuk CodeMirror agar dapat digulir */}
      {/* Penting: flex-1 dan overflow-y-auto di sini */}
      <div className="flex-1 overflow-y-auto">
        <CodeMirrorEditor
          code={code}
          language={language}
          readOnly={true}
          theme={currentTheme}
        />
      </div>
      <div className="flex justify-between items-center bg-secondary p-3 border-t border-border flex-shrink-0"> {/* Tambah flex-shrink-0 */}
        <ButtonCopy code={code} />
        <button
          onClick={handleShareCode}
          type="button"
          className="ml-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 dark:border-none h-9 px-4 py-2 has-[>svg]:px-3"
        >
          <ShareFat className="size-4" />
          Share Code
        </button>
      </div>
    </>
  );

  return (
    <CodeBlock className={cn(className, "relative")}>
      <CodeBlockGroup className="flex h-9 items-center justify-between px-4 rounded-t-xl">
        <div className="text-muted-foreground py-1 pr-2 font-mono text-xs">
          {language}
        </div>
      </CodeBlockGroup>

      {isMobile ? (
        <Drawer open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DrawerTrigger asChild>
            <div
              className="cursor-pointer w-full text-left p-4 rounded-b-xl hover:bg-accent/50 transition-colors flex items-center justify-center gap-2"
              onClick={() => setIsModalOpen(true)}
              {...props}
            >
              <Code className="size-5 text-muted-foreground" />
              <span className="font-medium text-foreground">View Generated {language} Code</span>
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
            <div
              className="cursor-pointer w-full text-left p-4 rounded-b-xl hover:bg-accent/50 transition-colors flex items-center justify-center gap-2"
              onClick={() => setIsModalOpen(true)}
              {...props}
            >
              <Code className="size-5 text-muted-foreground" />
              <span className="font-medium text-foreground">View {language} Code</span>
            </div>
          </DialogTrigger>
          {/* Penting: DialogContent juga harus flex-col */}
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
