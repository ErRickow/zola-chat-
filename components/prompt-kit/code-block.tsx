"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import React, { useEffect, useState, useMemo } from "react"
import { codeToHtml } from "shiki"
import {
  MorphingDialog,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogTrigger,
  MorphingDialogClose,
} from "@/components/motion-primitives/morphing-dialog"
import { ButtonCopy } from "../common/button-copy"
import { CodeMirrorEditor } from "../common/CodeMirror"

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
  language = "plaintext", // Default language
  theme: propTheme, // Rename propTheme to avoid conflict with useTheme's resolvedTheme
  className,
  ...props
}: CodeBlockCodeProps) {
  const { resolvedTheme: appTheme } = useTheme()
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)
  const uniqueId = React.useId()

  // Determine the theme for Shiki and CodeMirror
  const currentTheme = appTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    async function highlight() {
      // Use the resolved theme for Shiki highlighting
      const shikiTheme = currentTheme === "dark" ? "github-dark" : "github-light";
      const html = await codeToHtml(code, {
        lang: language,
        theme: shikiTheme,
      });
      setHighlightedHtml(html);
    }
    highlight();
  }, [code, language, currentTheme]); // Re-run effect if code, language, or theme changes

  const extractLanguage = (className?: string): string => {
    if (!className) return "plaintext";
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : "plaintext";
  };

  const truncatedCode = useMemo(() => {
    const lines = code.split('\n');
    if (lines.length > 5) { // Show only 5 lines for preview
      return lines.slice(0, 5).join('\n') + '\n... (Click to expand)';
    }
    return code;
  }, [code]);

  const classNames = cn(
    "w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4 [&>pre]:!bg-background",
    className
  );

  return (
    <CodeBlock className={cn(className, "relative")}>
      <CodeBlockGroup className="flex h-9 items-center justify-between px-4">
        <div className="text-muted-foreground py-1 pr-2 font-mono text-xs">
          {language}
        </div>
        {/* Tombol Copy untuk pratinjau, menyalin seluruh kode */}
        <ButtonCopy code={code} />
      </CodeBlockGroup>

      {/* MorphingDialog untuk menampilkan CodeMirror */}
      <MorphingDialog transition={{ type: "spring", stiffness: 280, damping: 18, mass: 0.3 }}>
        <MorphingDialogTrigger className="w-full text-left p-0">
          {/* Tampilan pratinjau yang akan diklik */}
          <div
            className={classNames}
            dangerouslySetInnerHTML={{ __html: highlightedHtml || `<pre><code>${truncatedCode}</code></pre>` }}
            {...props}
          />
          {code.split('\n').length > 5 && (
            <div className="text-muted-foreground text-center text-xs pt-2 pb-2 cursor-pointer hover:underline">
              Click to view full code
            </div>
          )}
        </MorphingDialogTrigger>

        <MorphingDialogContainer>
          <MorphingDialogContent className="w-[90vw] h-[80vh] max-w-4xl p-0 flex flex-col rounded-lg overflow-hidden">
            <div className="flex justify-between items-center bg-secondary p-3 border-b border-border">
              <span className="font-medium">{language} Code</span>
              <MorphingDialogClose className="static top-auto right-auto p-1 rounded-full hover:bg-accent" />
            </div>
            <div className="flex-1 overflow-hidden"> {/* Use overflow-hidden here */}
              {/* Menggunakan komponen CodeMirrorEditor */}
              <CodeMirrorEditor
                code={code}
                language={language}
                readOnly={true}
                theme={currentTheme}
              />
            </div>
            <div className="flex justify-between items-center bg-secondary p-3 border-t border-border">
              <ButtonCopy code={code} />
              {/* @TODO */}
              {/* <Button variant="outline" size="sm">Share</Button> */}
            </div>
          </MorphingDialogContent>
        </MorphingDialogContainer>
      </MorphingDialog>
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