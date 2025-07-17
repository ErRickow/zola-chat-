"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetchClient } from "@/lib/fetch";
import { toast } from "@/components/ui/toast";
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "@/components/prompt-kit/code-block";
import { ButtonCopy } from "@/components/common/button-copy";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowsOutSimple, CaretDown, ShareFat, Spinner } from "@phosphor-icons/react";
import { SkeletonLoader } from "./skeleton-loader";

export type CodeArtifactProps = {
  messageId: string;
  chatId: string;
  documentId: string;
  title: string;
  language: string;
  code: string;
  isLoading ? : boolean;
  className ? : string;
  defaultExpanded ? : boolean;
};

export function CodeArtifact({
  messageId,
  chatId,
  documentId,
  title,
  language,
  code,
  isLoading = false,
  className,
  defaultExpanded = false,
}: CodeArtifactProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the collapsible from toggling
    if (!chatId || !messageId) {
      toast({ title: "Error", description: "Missing chat or message ID.", status: "error" });
      return;
    }
    setIsSharing(true);
    try {
      await fetchClient(`/api/publish-chat`, {
        method: 'POST',
        body: JSON.stringify({ chatId }),
      });
      
      const shareLink = `${window.location.origin}/share/artifact/${messageId}`;
      navigator.clipboard.writeText(shareLink);
      
      toast({
        title: "Artifact Link Copied!",
        description: "You can now share this link with others.",
        status: "success",
      });
      
    } catch (error) {
      toast({
        title: "Failed to Share Artifact",
        description: "Please ensure the chat is public and try again.",
        status: "error",
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className={cn("not-prose my-6", className)}>
        <CodeBlock>
          <CodeBlockGroup className="flex h-11 items-center justify-between px-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{title || "Generating Code..."}</span>
              <span className="font-mono text-xs text-muted-foreground">
                Document ID: {documentId || "..."}
              </span>
            </div>
          </CodeBlockGroup>
          <SkeletonLoader />
        </CodeBlock>
      </div>
    );
  }
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className={cn("not-prose my-6", className)}>
        <CodeBlock>
          <button
            className="flex w-full cursor-pointer items-center justify-between px-4 h-11 hover:bg-muted/50 transition-colors rounded-t-md"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            <div className="flex flex-col text-left overflow-hidden pr-2">
              <span className="truncate text-sm font-semibold">{title}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                Document ID: {documentId}
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
               <CaretDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </div>
          </button>
          
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="content"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={{
                  open: { opacity: 1, height: "auto" },
                  collapsed: { opacity: 0, height: 0 },
                }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden"
              >
                <div className="border-t border-border p-2 pt-0">
                  <div className="flex justify-end py-1 pr-1">
                      <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                              <ArrowsOutSimple className="h-4 w-4" />
                              <span className="sr-only">View Full Code</span>
                          </Button>
                      </DialogTrigger>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShare} disabled={isSharing}>
                          {isSharing ? <Spinner className="h-4 w-4 animate-spin" /> : <ShareFat className="h-4 w-4" />}
                          <span className="sr-only">Share Artifact</span>
                      </Button>
                      <ButtonCopy code={code} />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <CodeBlockCode code={code} language={language} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CodeBlock>
      </div>
      
      <DialogContent className="flex max-w-4xl flex-col p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto px-4">
          <CodeBlock className="border">
            <CodeBlockCode code={code} language={language} />
          </CodeBlock>
        </div>
        <DialogFooter className="p-4 pt-2">
          <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}