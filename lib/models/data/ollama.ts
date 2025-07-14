// Berkas ini sekarang hanya akan berisi definisi model Neosantara Anda.
// Kami menggunakan "ollama" sebagai providerId internal agar Zola menggunakan OLLAMA_BASE_URL.

import { openproviders } from "@/lib/openproviders";
import { ModelConfig } from "../types";

// Fungsi untuk mendapatkan URL dasar Ollama (yang sekarang akan menjadi API Neosantara Anda)
const getOllamaBaseURL = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434";
  }
  return process.env.OLLAMA_BASE_URL?.replace(/\/+$/, "") || "http://localhost:11434";
};

// Fungsi untuk membuat instance provider Ollama (yang sekarang memanggil API Neosantara Anda)
// Ini adalah wrapper untuk createOpenAI yang sebenarnya ada di lib/openproviders/index.ts
// Kita tidak perlu mendeklarasikan ulang apiKey di sini karena sudah ditangani di openproviders/index.ts
const createOllamaProviderInstance = () => {
  return openproviders.createOpenAI({
    baseURL: `${getOllamaBaseURL()}/v1`,
    apiKey: "dummy-key", // Kunci ini akan diganti oleh yang di lib/openproviders/index.ts
    name: "neosantara",
  });
};


// Definisi model-model Neosantara Anda
const neosantaraModels: ModelConfig[] = [
  {
    id: "nusantara-base", // ID model Anda dari API Neosantara
    name: "Nusantara Base", // Nama yang akan ditampilkan di UI Zola
    provider: "Neosantara", // Nama penyedia yang akan ditampilkan di UI
    providerId: "ollama", // PENTING: Pertahankan ini agar Zola menggunakan OLLAMA_BASE_URL
    modelFamily: "Nusantara",
    baseProviderId: "ollama", // Pertahankan ini untuk ikon default Ollama atau ganti jika ada ikon kustom
    description: "Model dasar Neosantara AI dari layanan kustom Anda.",
    tags: ["custom", "openai-compatible", "indonesian"],
    contextWindow: 32768, // Sesuaikan dengan kemampuan model Anda
    inputCost: 0.0, // Biaya 0 karena ini adalah layanan kustom Anda
    outputCost: 0.0,
    priceUnit: "free (custom)",
    vision: false, // Sesuaikan kemampuan model Anda
    tools: true,
    audio: false,
    reasoning: true,
    openSource: false, // Sesuaikan
    speed: "Fast", // Sesuaikan
    intelligence: "High", // Sesuaikan
    website: "https://api.neosantara.xyz", // Ganti dengan URL dokumentasi/situs Anda
    apiDocs: "https://api.neosantara.xyz/docs", // Ganti dengan URL dokumentasi API Anda
    modelPage: "https://api.neosantara.xyz/models/nusantara-base", // Ganti dengan URL halaman model Anda
    icon: "ollama", // Menggunakan ikon Ollama default, atau ganti jika Anda membuat ikon kustom
    apiSdk: (apiKey?: string) =>
      openproviders(
        "nusantara-base" as string,
        undefined,
        apiKey // Meneruskan apiKey yang mungkin berasal dari BYOK (jika diaktifkan kembali)
      ),
  },
  {
    id: "archipelago-7b", // Contoh model kedua dari API Neosantara Anda
    name: "Archipelago 7B",
    provider: "Neosantara",
    providerId: "ollama",
    modelFamily: "Archipelago",
    baseProviderId: "ollama",
    description: "Model Archipelago 7B dari Neosantara AI.",
    tags: ["custom", "indonesian", "large"],
    contextWindow: 65536,
    inputCost: 0.0,
    outputCost: 0.0,
    priceUnit: "free (custom)",
    vision: false,
    tools: true,
    audio: false,
    reasoning: true,
    openSource: false,
    speed: "Medium",
    intelligence: "High",
    website: "https://api.neosantara.xyz",
    apiDocs: "https://api.neosantara.xyz/docs",
    modelPage: "https://api.neosantara.xyz/models/archipelago-7b",
    icon: "ollama",
    apiSdk: (apiKey?: string) =>
      openproviders(
        "archipelago-7b" as string,
        undefined,
        apiKey
      ),
  },
];

// Fungsi untuk mendapatkan model Ollama (yang sekarang adalah model Neosantara Anda)
export async function getOllamaModels(): Promise<ModelConfig[]> {
  return neosantaraModels;
}

// Untuk kompatibilitas mundur, ekspor model statis
export const ollamaModels = neosantaraModels;
