// Berkas ini akan menyertakan variabel lingkungan untuk kunci API Neosantara Anda.

export const env = {
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL!,
  // Tambahkan variabel lingkungan untuk kunci API Neosantara Anda di sini
  NEOSANTARA_API_KEY: process.env.NEOSANTARA_API_KEY!, // Kunci API Neosantara Anda
};

export function createEnvWithUserKeys(
  userKeys: Record<string, string> = {}
): typeof env {
  return {
    OLLAMA_BASE_URL: userKeys.ollama || env.OLLAMA_BASE_URL,
    // Pastikan kunci API Neosantara Anda juga disertakan di sini
    NEOSANTARA_API_KEY: userKeys.neosantara || env.NEOSANTARA_API_KEY,
  };
}
