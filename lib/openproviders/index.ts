// Berkas ini sekarang hanya akan mendukung penyedia "ollama"
// dan memperbaiki masalah type checking untuk createOpenAI dengan lebih akurat.

// PENTING: Pertahankan impor ini.
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { getProviderForModel } from "./provider-map";
import { env } from "./env"; // Impor variabel lingkungan
import type {
  OllamaModel, // PENTING: Pertahankan ini
  SupportedModel,
} from "./types";

// Hapus semua impor lain yang tidak digunakan (Anthropic, Google, Mistral, Perplexity, Xai)
// import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
// import { createMistral, mistral } from "@ai-sdk/mistral";
// import { createPerplexity, perplexity } from "@ai-sdk/perplexity";
// import { createXai, xai } from "@ai-sdk/xai";
// import { createAnthropic, anthropic } from "@ai-sdk/anthropic";

// Definisi tipe yang lebih akurat untuk setelan chat yang diteruskan ke .chat()
// Kita ambil langsung dari parameter kedua metode .chat() dari @ai-sdk/openai
// Parameters<typeof createOpenAI().chat>[1] akan mendapatkan tipe parameter kedua dari fungsi chat()
type OpenAIChatMethodSettings = Parameters<ReturnType<typeof createOpenAI>['chat']>[1];

// Tipe untuk konfigurasi provider Ollama (yang sekarang adalah Neosantara)
// Ini adalah tipe yang akan digunakan di ModelConfig.apiSdk
type OllamaProviderSettings = OpenAIChatMethodSettings;

type ModelSettings<T extends SupportedModel> = T extends OllamaModel
  ? OllamaProviderSettings
  : never; // Hanya OllamaModel yang tersisa

export type OpenProvidersOptions<T extends SupportedModel> = ModelSettings<T>;

// Mendapatkan URL dasar Ollama (yang sekarang adalah API Neosantara Anda)
const getOllamaBaseURL = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434";
  }
  return (
    process.env.OLLAMA_BASE_URL?.replace(/\/+$/, "") || "http://localhost:11434"
  );
};

export function openproviders<T extends SupportedModel>(
  modelId: T,
  settings?: OpenProvidersOptions<T>,
  apiKey?: string // Parameter apiKey ini dari Zola's BYOK. Kita bisa menggunakannya jika ada.
): LanguageModelV1 {
  const provider = getProviderForModel(modelId);

  if (provider === "ollama") {
    const ollamaInstance = createOpenAI({
      baseURL: `${getOllamaBaseURL()}/v1`,
      apiKey: apiKey || env.NEOSANTARA_API_KEY,
    });

    // Panggil metode .chat() pada instance provider yang dibuat
    // dan pastikan setelan yang diteruskan sesuai dengan OpenAIChatMethodSettings.
    return ollamaInstance.chat(
      modelId as string, // Cast modelId ke string
      settings as OpenAIChatMethodSettings // Cast settings ke tipe yang benar
    );
  }

  // Jika Anda menghapus semua penyedia lain, baris ini akan menjadi satu-satunya 'throw'
  throw new Error(`Unsupported model or provider: ${modelId}`);
}

// Ekspor createOpenAI agar bisa diakses oleh ollama.ts
openproviders.createOpenAI = createOpenAI;
