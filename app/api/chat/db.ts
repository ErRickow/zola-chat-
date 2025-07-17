import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/app/types/database.types";
import type { Message, ContentPart } from "@/app/types/api.types";

// Note: In Node.js environments (like this API route), 'crypto' is a built-in module.
import { randomUUID } from "crypto";

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
    const textParts: { type: 'text' | 'code_artifact', content: any }[] = [];

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        textParts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      
      const language = match[1] || 'plaintext';
      textParts.push({
        type: 'code_artifact',
        content: {
          documentId: `code-artifact-${randomUUID()}`,
          title: `Generated ${language.charAt(0).toUpperCase() + language.slice(1)} Snippet`,
          language: language,
          code: match[2].trim(),
        }
      });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      textParts.push({ type: 'text', content: text.substring(lastIndex) });
    }
    
    return textParts;
  }

  for (const msg of messages) {
    if (msg.role !== 'assistant' || !Array.isArray(msg.content)) {
      continue;
    }

    for (const part of msg.content) {
      if (part.type === 'text' && part.text) {
        const processedSubParts = processTextForCodeArtifacts(part.text);
        for (const subPart of processedSubParts) {
          if (subPart.type === 'text') {
            finalParts.push({ type: 'text', text: subPart.content });
          } else if (subPart.type === 'code_artifact') {
            finalParts.push({ ...subPart.content, type: 'code_artifact' });
          }
        }
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
      if (p.type === 'code_artifact') return `[Code: ${p.title}]`;
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