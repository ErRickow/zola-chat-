"use client";

import React, { useState } from "react";
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
import { ArrowsOutSimple, ShareFat } from "@phosphor-icons/react";
import { Spinner } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { fetchClient } from "@/lib/fetch";
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
}: CodeArtifactProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const handleShare = async () => {
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
          <CodeBlockGroup className="flex h-11 items-center justify-between px-4">
            <div className="flex flex-col overflow-hidden pr-2">
              <span className="truncate text-sm font-semibold">{title}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                Document ID: {documentId}
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShare} disabled={isSharing}>
                {isSharing ? <Spinner className="h-4 w-4 animate-spin" /> : <ShareFat className="h-4 w-4" />}
                <span className="sr-only">Share Artifact</span>
              </Button>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ArrowsOutSimple className="h-4 w-4" />
                  <span className="sr-only">View Full Code</span>
                </Button>
              </DialogTrigger>
              <ButtonCopy code={code} />
            </div>
          </CodeBlockGroup>
          <div className="max-h-64 overflow-y-auto">
             <CodeBlockCode code={code} language={language} />
          </div>
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