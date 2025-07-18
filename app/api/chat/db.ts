import type { ContentPart, Message } from "@/app/types/api.types"
import type { Database, Json } from "@/app/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_STEP = 0

export async function saveFinalAssistantMessage(
  supabase: SupabaseClient < Database > ,
  chatId: string,
  messages: Message[],
  message_group_id ? : string,
  model ? : string
) {
  const parts: ContentPart[] = []
  // Menggunakan Map untuk menyimpan objek ContentPart tool-invocation lengkap, termasuk toolName
  const toolMap = new Map < string,
    ContentPart > ()
  const textParts: string[] = [] // Untuk mengumpulkan konten teks murni
  
  // Pass pertama: Proses pesan assistant dan kumpulkan semua bagian, termasuk tool-invocation.
  // Gunakan toolMap untuk menyimpan tool-invocation lengkap.
  for (const msg of messages) {
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text") {
          textParts.push(part.text || "")
          parts.push(part)
        } else if (part.type === "tool-invocation" && part.toolInvocation) {
          const { toolCallId, toolName, args } = part.toolInvocation
          if (!toolCallId) continue
          
          // Simpan tool-invocation ke toolMap. Ini akan memastikan toolName tersimpan.
          toolMap.set(toolCallId, {
            type: "tool-invocation",
            toolInvocation: {
              ...part.toolInvocation, // Menyalin semua properti yang ada
              toolName: toolName || "", // Memastikan toolName ada
              args: args || {},
            },
          })
          // Tambahkan ke `parts` untuk memastikan urutan jika diperlukan
          parts.push(toolMap.get(toolCallId) !)
        } else if (part.type === "reasoning") {
          parts.push({
            type: "reasoning",
            reasoning: part.text || "",
            details: [
            {
              type: "text",
              text: part.text || "",
            }, ],
          })
        } else if (part.type === "step-start") {
          parts.push(part)
        }
      }
    }
  }
  
  // Pass kedua: Proses pesan tool (hasil) dan perbarui toolMap dengan hasilnya.
  // Karena toolMap sudah berisi toolName dari pass pertama, kita bisa menggunakannya.
  for (const msg of messages) {
    if (msg.role === "tool" && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "tool-result") {
          const toolCallId = part.toolCallId || ""
          if (!toolCallId) continue
          
          const existingInvocationEntry = toolMap.get(toolCallId)
          const existingToolInvocation = existingInvocationEntry?.toolInvocation;
          
          if (existingToolInvocation) {
            // Perbarui entri yang ada di toolMap
            toolMap.set(toolCallId, {
              type: "tool-invocation", // Tetap sebagai tool-invocation karena ini hasil dari invocation
              toolInvocation: {
                ...existingToolInvocation, // Pertahankan toolName dan argumen dari invocation asli
                state: "result", // Perbarui status ke "result"
                result: part.result, // Tambahkan hasil eksekusi
              },
            })
          } else {
            // Kasus fallback: Jika tool-result diterima tanpa tool-invocation yang sesuai sebelumnya.
            // Ini bisa terjadi jika ada bug atau ketidaksesuaian.
            // Di sini, toolName mungkin masih kosong jika tidak ada di `part.toolName`.
            console.warn(`Tool result for toolCallId: ${toolCallId} found without a preceding tool-invocation.`)
            toolMap.set(toolCallId, {
              type: "tool-invocation",
              toolInvocation: {
                state: "result",
                step: DEFAULT_STEP,
                toolCallId,
                toolName: (part as any).toolName || "", // Fallback ke part.toolName (mungkin kosong)
                result: part.result,
              },
            });
            // Jika Anda menambahkan ini ke `parts`, pastikan tidak ada duplikasi.
            // Untuk kesederhanaan, kita hanya mengandalkan penggabungan dari `toolMap.values()` di akhir.
          }
        }
      }
    }
  }
  
  // Gabungkan konten teks dan kemudian gabungkan semua tool invocations yang sudah final dari toolMap.
  // Pastikan untuk menghapus duplikasi jika tool-invocation sudah dimasukkan di pass pertama.
  const finalParts = parts.filter(p =>
    !(p.type === "tool-invocation" && toolMap.has(p.toolInvocation?.toolCallId || "")) ||
    (toolMap.get(p.toolInvocation?.toolCallId || "")?.toolInvocation?.state === "result") // Pertahankan jika sudah result
  );
  
  // Tambahkan versi terbaru (final) dari tool invocations dari map
  // Ini akan menimpa versi awal yang mungkin sudah ada di `parts`
  for (const [toolCallId, toolPart] of toolMap.entries()) {
    const existingIndex = finalParts.findIndex(p => p.type === "tool-invocation" && p.toolInvocation?.toolCallId === toolCallId);
    if (existingIndex !== -1) {
      finalParts[existingIndex] = toolPart; // Ganti dengan versi terbaru
    } else {
      finalParts.push(toolPart); // Tambahkan jika belum ada
    }
  }
  
  const finalPlainText = textParts.join("\n\n")
  
  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "assistant",
    content: finalPlainText || "",
    parts: finalParts as unknown as Json,
    message_group_id,
    model,
  })
  
  if (error) {
    console.error("Error saving final assistant message:", error)
    throw new Error(`Failed to save assistant message: ${error.message}`)
  } else {
    console.log("Assistant message saved successfully (merged).")
  }
}