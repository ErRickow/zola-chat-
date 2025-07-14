// Berkas ini sekarang hanya akan mendukung penyedia "ollama"
// dan memperbaiki masalah type checking untuk createOpenAI.

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

// Karena kita hanya menggunakan model chat yang kompatibel dengan OpenAI,
// kita bisa menyederhanakan definisi tipenya.
type OpenAIChatSettings = Parameters<typeof createOpenAI>[0]; // Ini sudah benar untuk konfigurasi dasar createOpenAI
type OllamaProviderSettings = OpenAIChatSettings;

type ModelSettings<T extends SupportedModel> = T extends OllamaModel
  ? OllamaProviderSettings
  : never;

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

// Membuat instance provider Ollama dengan baseURL yang dapat dikonfigurasi
// Ini akan digunakan untuk memanggil API Neosantara Anda
const createOllamaProvider = () => {
  return createOpenAI({
    baseURL: `${getOllamaBaseURL()}/v1`, // Menambahkan /v1 karena API Neosantara Anda memiliki /v1/chat/completions
    apiKey: env.NEOSANTARA_API_KEY, // Menggunakan kunci API dari variabel lingkungan
    // name: "neosantara", // Properti 'name' tidak ada di tipe createOpenAI, jadi hapus atau komentari ini
  });
};

export function openproviders<T extends SupportedModel>(
  modelId: T,
  settings?: OpenProvidersOptions<T>,
  apiKey?: string // Parameter apiKey ini dari Zola's BYOK. Kita bisa menggunakannya jika ada.
): LanguageModelV1 {
  const provider = getProviderForModel(modelId);

  if (provider === "ollama") {
    // Panggil createOpenAI langsung di sini dengan modelId yang benar
    // dan pastikan setelan yang diteruskan sesuai dengan OpenAIChatSettings.
    // Kita perlu memastikan bahwa `modelId` yang diteruskan adalah tipe yang diharapkan oleh `openai.chat()`.
    // Karena kita sudah membatasi `OllamaModel` untuk menjadi string ID, ini harusnya cocok.
    return createOpenAI({
      baseURL: `${getOllamaBaseURL()}/v1`,
      apiKey: apiKey || env.NEOSANTARA_API_KEY,
    }).chat(
      modelId as string, // Cast modelId ke string karena createOpenAI().chat() mengharapkan string modelId
      settings as OpenAIChatSettings // Pastikan settings sesuai dengan OpenAIChatSettings
    );
  }

  // Jika Anda menghapus semua penyedia lain, baris ini akan menjadi satu-satunya 'throw'
  throw new Error(`Unsupported model or provider: ${modelId}`);
}

// Ekspor createOpenAI agar bisa diakses oleh ollama.ts
openproviders.createOpenAI = createOpenAI;
