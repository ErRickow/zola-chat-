// Berkas ini sekarang hanya akan mengimpor model Ollama (Neosantara Anda)

import { getOllamaModels, ollamaModels } from "./data/ollama";
import { ModelConfig } from "./types";

// Model statis (hanya model Neosantara Anda yang tersisa)
const STATIC_MODELS: ModelConfig[] = [
  ...ollamaModels, 
];

// Cache model dinamis
let dynamicModelsCache: ModelConfig[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// Fungsi untuk mendapatkan semua model termasuk yang terdeteksi secara dinamis
export async function getAllModels(): Promise<ModelConfig[]> {
  const now = Date.now();

  // Menggunakan cache jika masih valid
  if (dynamicModelsCache && now - lastFetchTime < CACHE_DURATION) {
    return dynamicModelsCache;
  }

  try {
    // Mendapatkan model Ollama yang terdeteksi (yang sekarang adalah Neosantara Anda)
    const detectedOllamaModels = await getOllamaModels();

    // Menggabungkan model statis dengan yang terdeteksi
    // Karena kita sudah menghapus yang lain, ini akan menjadi sederhana
    dynamicModelsCache = [...STATIC_MODELS.filter(model => model.providerId !== "ollama"), ...detectedOllamaModels];

    lastFetchTime = now;
    return dynamicModelsCache;
  } catch (error) {
    console.warn("Failed to load dynamic models, using static models:", error);
    return STATIC_MODELS; // Fallback ke model statis (Neosantara Anda)
  }
}

// Fungsi untuk mendapatkan model dengan flag akses
export async function getModelsWithAccessFlags(): Promise<ModelConfig[]> {
  const models = await getAllModels();


  {/** TODO **/}
  // semua akan ditandai sebagai dapat diakses.
  const accessibleModels = models.map((model) => ({
    ...model,
    accessible: true, // Semua model kustom Anda dapat diakses
  }));

  return accessibleModels;
}

// Fungsi untuk mendapatkan model berdasarkan penyedia (sekarang hanya "ollama" / "neosantara")
export async function getModelsForProvider(
  provider: string
): Promise<ModelConfig[]> {
  const models = STATIC_MODELS; // Menggunakan model statis yang sudah difilter

  const providerModels = models
    .filter((model) => model.providerId === provider)
    .map((model) => ({
      ...model,
      accessible: true,
    }));

  return providerModels;
}

// Fungsi untuk mendapatkan model berdasarkan penyedia pengguna (sekarang hanya "ollama" / "neosantara")
export async function getModelsForUserProviders(
  providers: string[]
): Promise<ModelConfig[]> {
  const providerModels = await Promise.all(
    providers.map((provider) => getModelsForProvider(provider))
  );

  const flatProviderModels = providerModels.flat();

  return flatProviderModels;
}

// Fungsi sinkron untuk mendapatkan info model
export function getModelInfo(modelId: string): ModelConfig | undefined {
  if (dynamicModelsCache) {
    return dynamicModelsCache.find((model) => model.id === modelId);
  }

  return STATIC_MODELS.find((model) => model.id === modelId);
}

// Untuk kompatibilitas mundur - model statis saja
export const MODELS: ModelConfig[] = STATIC_MODELS;

// Fungsi untuk me-refresh cache model
export function refreshModelsCache(): void {
  dynamicModelsCache = null;
  lastFetchTime = 0;
}
