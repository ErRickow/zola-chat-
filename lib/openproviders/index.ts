// Berkas ini akan dimodifikasi untuk menggunakan NEOSANTARA_API_KEY saat memanggil API Neosantara Anda.

import { createOpenAI } from "@ai-sdk/openai"; // PENTING: Pertahankan ini untuk API Neosantara Anda
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { getProviderForModel } from "./provider-map";
import { env } from "./env"; // Impor variabel lingkungan
import type {
  OllamaModel, // PENTING: Pertahankan ini
  SupportedModel,
} from "./types";

// Hapus impor untuk penyedia yang tidak Anda gunakan (Anthropic, Deepseek, OpenRouter, dll.)
// import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
// import { createMistral, mistral } from "@ai-sdk/mistral";
// import { createPerplexity, perplexity } from "@ai-sdk/perplexity";
// import { createXai, xai } from "@ai-sdk/xai";

type OpenAIChatSettings = Parameters<typeof createOpenAI>[0]; // Sesuaikan ini agar sesuai dengan createOpenAI
type OllamaProviderSettings = OpenAIChatSettings; // Ollama menggunakan API yang kompatibel dengan OpenAI

type ModelSettings<T extends SupportedModel> = T extends OllamaModel
  ? OllamaProviderSettings
  : never; // Hanya OllamaModel yang tersisa

export type OpenProvidersOptions<T extends SupportedModel> = ModelSettings<T>;

// Mendapatkan URL dasar Ollama (yang sekarang adalah API Neosantara Anda)
const getOllamaBaseURL = () => {
  if (typeof window !== "undefined") {
    // Sisi klien: menggunakan NEXT_PUBLIC_OLLAMA_BASE_URL
    return process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434";
  }

  // Sisi server: memeriksa variabel lingkungan OLLAMA_BASE_URL
  return (
    process.env.OLLAMA_BASE_URL?.replace(/\/+$/, "") || "http://localhost:11434"
  );
};

// Membuat instance provider Ollama dengan baseURL yang dapat dikonfigurasi
// Ini akan digunakan untuk memanggil API Neosantara Anda
const createOllamaProvider = () => {
  return createOpenAI({
    baseURL: `${getOllamaBaseURL()}/v1`, // Menambahkan /v1 karena API Neosantara Anda memiliki /v1/chat/completions
    apiKey: env.NEOSANTARA_API_KEY, // UBAH INI: Menggunakan kunci API dari variabel lingkungan
    // Jika Anda ingin mengizinkan pengguna memasukkan kunci API Neosantara secara manual,
    // Anda perlu mengintegrasikan `apiKey` yang diteruskan ke fungsi `openproviders` di sini.
    // Untuk saat ini, kita asumsikan kunci sudah ada di env.
    name: "neosantara", // Nama internal untuk penyedia ini
  });
};

export function openproviders<T extends SupportedModel>(
  modelId: T,
  settings?: OpenProvidersOptions<T>,
  apiKey?: string // Parameter apiKey ini dari Zola's BYOK. Kita bisa menggunakannya jika ada.
): LanguageModelV1 {
  const provider = getProviderForModel(modelId);

  if (provider === "ollama") {
    const ollamaProvider = createOpenAI({
      baseURL: `${getOllamaBaseURL()}/v1`,
      // Prioritaskan apiKey yang diteruskan (dari BYOK) jika ada,
      // jika tidak, gunakan kunci dari env.
      apiKey: apiKey || env.NEOSANTARA_API_KEY,
      name: "neosantara",
    });
    return ollamaProvider(
      modelId as OllamaModel,
      settings as OllamaProviderSettings
    );
  }

  // Jika Anda menghapus semua penyedia lain, baris ini akan menjadi satu-satunya 'throw'
  throw new Error(`Unsupported model or provider: ${modelId}`);
}

// Ekspor createOpenAI agar bisa diakses oleh ollama.ts
openproviders.createOpenAI = createOpenAI;
