import { CodeArtifact } from "@/components/common/code-artifact";
import { NeosantaraLogoText } from "@/components/icons/neosantara";
import { APP_DOMAIN } from "@/lib/config";
// CORRECTED IMPORT
import type { Message } from "@/lib/chat-store/types";
import type { ContentPart } from "@/app/types/api.types";
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

export default async function ShareArtifactPage({
  params,
}: {
  params: Promise < { messageId: string } > ;
}) {
  const { messageId } = await params;
  const message = await getArtifact(messageId);
  
  // This line will now work because the imported 'Message' type has the 'parts' property.
  const artifactPart = (Array.isArray(message?.parts) ?
    message.parts.find((p: any) => p.type === "code_artifact") :
    null) as(ContentPart & { code ? : string;title ? : string;language ? : string;documentId ? : string }) | null;
  
  if (!message || !artifactPart) {
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
            documentId={artifactPart.documentId!}
            title={artifactPart.title!}
            language={artifactPart.language!}
            code={artifactPart.code!}
          />
       </main>
       <footer className="text-muted-foreground mt-8 text-center text-sm">
         Shared from Neosantara AI
       </footer>
    </div>
  );
}