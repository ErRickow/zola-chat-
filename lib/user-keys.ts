import { decryptKey } from "./encryption";
import { env } from "./openproviders/env";
import { Provider } from "./openproviders/types";
import { createClient } from "./supabase/server";

export type { Provider } from "./openproviders/types";
// UBAH DEFINISI TIPE INI
// Sebelumnya: export type ProviderWithoutOllama = Exclude<Provider, "ollama">;
// Sekarang: Hanya 'ollama' yang tersisa
export type ProviderWithoutOllama = "ollama"; // Hanya satu provider yang tersisa: ollama

export async function getUserKey(
  userId: string,
  provider: Provider
): Promise<string | null> {
  try {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("user_keys")
      .select("encrypted_key, iv")
      .eq("user_id", userId)
      .eq("provider", provider)
      .single();

    if (error || !data) return null;

    return decryptKey(data.encrypted_key, data.iv);
  } catch (error) {
    console.error("Error retrieving user key:", error);
    return null;
  }
}

export async function getEffectiveApiKey(
  userId: string | null,
  provider: ProviderWithoutOllama // Tipe ini sekarang hanya akan "ollama"
): Promise<string | null> {
  if (userId) {
    const userKey = await getUserKey(userId, provider);
    if (userKey) return userKey;
  }

  // Karena kita hanya memiliki satu penyedia (Neosantara melalui Ollama),
  // kita bisa langsung mengembalikan kunci API Neosantara dari env.
  // Hapus objek envKeyMap dan langsung kembalikan env.NEOSANTARA_API_KEY.
  return env.NEOSANTARA_API_KEY || null;
}
