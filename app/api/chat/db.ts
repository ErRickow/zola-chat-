import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/app/types/database.types";
import type { Message } from "@/app/types/api.types";

export async function saveFinalAssistantMessage(
  supabase: SupabaseClient < Database > ,
  chatId: string,
  messages: Message[],
  message_group_id ? : string,
  model ? : string
) {
  // Get the final assistant message from the response array
  const assistantMessage = messages.find(msg => msg.role === 'assistant');
  
  if (!assistantMessage) {
    return; // Nothing to save
  }
  
  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "assistant",
    // Save the raw content and the full parts array directly from the AI SDK
    content: assistantMessage.content as string | null,
    parts: assistantMessage.content as unknown as Json,
    message_group_id,
    model,
  });
  
  if (error) {
    console.error("Error saving final assistant message:", error);
    throw new Error(`Failed to save assistant message: ${error.message}`);
  }
}