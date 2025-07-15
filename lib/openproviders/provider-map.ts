// Berkas ini sekarang hanya akan berisi pemetaan untuk model "ollama" (Neosantara Anda)

import type { Provider, SupportedModel } from "./types";

// Peta setiap ID model ke penyedianya
const MODEL_PROVIDER_MAP: Record<string, Provider> = {
  // Hanya sertakan model dari layanan Neosantara Anda yang Anda definisikan di ollama.ts
  "nusantara-base": "ollama",
  "archipelago-7b": "ollama",
  "bahasa-llm": "ollama",
  // Tambahkan semua ID model kustom Anda di sini dengan nilai "ollama"
};

// Fungsi untuk memeriksa apakah model kemungkinan adalah model Ollama (sekarang Neosantara Anda)
function isOllamaModel(modelId: string): boolean {
  // Pola umum model Ollama atau model kustom Anda
  const ollamaPatterns = [
    /^nusantara-/, // Contoh: Jika ID model Anda dimulai dengan "nusantara-"
    /^archipelago-/,
    /^bahasa-/,
    // Tambahkan pola lain yang sesuai dengan ID model kustom Anda
    /:latest$/i,
    /:[\d.]+[bB]?$/i, // versi tag seperti :7b, :13b, :1.5
  ];

  return ollamaPatterns.some((pattern) => pattern.test(modelId));
}

export function getProviderForModel(model: SupportedModel): Provider {
  // Pertama periksa pemetaan statis
  const provider = MODEL_PROVIDER_MAP[model];
  if (provider) return provider;

  // Jika tidak ditemukan di pemetaan statis, periksa apakah itu terlihat seperti model Ollama (Neosantara Anda)
  if (isOllamaModel(model)) {
    return "ollama";
  }

  // Jika tidak ada yang cocok, ini berarti model yang tidak dikenal.
  // Dalam kasus ini, karena kita hanya ingin Neosantara, kita bisa menganggapnya sebagai error
  // atau secara default ke "ollama" jika itu adalah satu-satunya yang diizinkan.
  // Untuk keamanan, lebih baik melempar error jika model tidak dikenal.
  throw new Error(`Unknown provider for model: ${model}. Only Neosantara models are supported.`);
}
