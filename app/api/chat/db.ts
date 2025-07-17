import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/app/types/database.types";
import type { Message, ContentPart } from "@/app/types/api.types";

// CORRECTED IMPORT: Use the Web Crypto API which is available globally in modern Node.js and Edge runtimes.
// This avoids module resolution issues during the Vercel build process.
const crypto = globalThis.crypto;

export async function saveFinalAssistantMessage(
  supabase: SupabaseClient<Database>,
  chatId: string,
  messages: Message[],
  message_group_id?: string,
  model?: string
) {
  const finalParts: ContentPart[] = [];
  const toolMap = new Map<string, ContentPart>();

  const processTextForCodeArtifacts = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
    let lastIndex = 0;
    let match;
    const processedParts: ContentPart[] = [];

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        processedParts.push({ type: 'text', text: text.substring(lastIndex, match.index) });
      }
      const language = match[1] || 'plaintext';
      processedParts.push({
        type: 'code_artifact',
        documentId: `code-artifact-${crypto.randomUUID()}`,
        title: `Generated ${language.charAt(0).toUpperCase() + language.slice(1)} Snippet`,
        language: language,
        code: match[2].trim(),
      } as ContentPart); // Casting here for type safety
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      processedParts.push({ type: 'text', text: text.substring(lastIndex) });
    }
    return processedParts;
  }

  for (const msg of messages) {
    if (msg.role !== 'assistant' || !Array.isArray(msg.content)) {
      continue;
    }

    for (const part of msg.content) {
        if (part.type === 'text' && part.text) {
            finalParts.push(...processTextForCodeArtifacts(part.text));
        } else if (part.type === 'tool-invocation' && part.toolInvocation) {
            const { toolCallId, state } = part.toolInvocation;
            if (!toolCallId) continue;
            const existing = toolMap.get(toolCallId);
            if (state === 'result' || !existing) {
                toolMap.set(toolCallId, part);
            }
        } else if (part.type === 'reasoning') {
            finalParts.push(part);
        }
    }
  }

  const allParts = [...finalParts, ...Array.from(toolMap.values())];
  const finalPlainText = allParts
    .map(p => {
      if (p.type === 'text') return p.text;
      if (p.type === 'code_artifact') return `[Code: ${(p as any).title}]`;
      if (p.type === 'tool-invocation') return `[Tool call: ${p.toolInvocation?.toolName}]`;
      if (p.type === 'reasoning') return `[Reasoning]`;
      return '';
    })
    .join(' ').trim();

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "assistant",
    content: finalPlainText || "Assistant message",
    parts: allParts.length > 0 ? (allParts as unknown as Json) : null,
    message_group_id,
    model,
  });

  if (error) {
    console.error("Error saving final assistant message:", error);
    throw new Error(`Failed to save assistant message: ${error.message}`);
  }
}