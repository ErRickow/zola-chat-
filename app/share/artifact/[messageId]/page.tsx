import { CodeArtifact } from "@/components/common/code-artifact";
import { NeosantaraLogoText } from "@/components/icons/neosantara";
import { APP_DOMAIN } from "@/lib/config";
import type { Message } from "@/lib/chat-store/types";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getArtifact(messageId: string): Promise < Message | null > {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : APP_DOMAIN;
    const res = await fetch(`${baseUrl}/api/share/artifact/${messageId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch artifact:", error);
    return null;
  }
}

const parseCodeBlockForPage = (markdown: string | null) => {
  if (!markdown) return null;
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/;
  const match = markdown.match(codeBlockRegex);
  if (match) {
    const language = match[1] || 'plaintext';
    const code = match[2].trim();
    return {
      language,
      code,
      title: `Generated ${language.charAt(0).toUpperCase() + language.slice(1)} Snippet`
    };
  }
  return null;
}

export default async function ShareArtifactPage({
  params,
}: {
  params: Promise < { messageId: string } > ;
}) {
  const { messageId } = await params;
  const message = await getArtifact(messageId);
  const artifactInfo = parseCodeBlockForPage(message?.content);
  
  if (!message || !artifactInfo) {
    return notFound();
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
       <header className="mb-8">
         <Link href="/" className="inline-flex items-center">
            <NeosantaraLogoText className="mr-1 dark:invert" />
         </Link>
       </header>
       <main className="w-full max-w-3xl">
          <CodeArtifact
            messageId={String(message.id)}
            chatId={message.chat_id as string}
            documentId={`code-artifact-${message.id}`}
            title={artifactInfo.title}
            language={artifactInfo.language}
            code={artifactInfo.code}
            defaultExpanded={true}
          />
       </main>
       <footer className="text-muted-foreground mt-8 text-center text-sm">
         Shared from Neosantara AI
       </footer>
    </div>
  );
}