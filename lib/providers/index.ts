// Berkas ini sekarang hanya akan berisi entri untuk penyedia "Neosantara" (sebelumnya Ollama)

import Ollama from "@/components/icons/ollama"; // Menggunakan ikon Ollama default

export type Provider = {
  id: string;
  name: string;
  available: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export const PROVIDERS: Provider[] = [
  {
    id: "ollama", // PENTING: Pertahankan ID internal ini sebagai "ollama"
    name: "Neosantara", // UBAH INI: Nama yang akan ditampilkan di UI Zola
    available: true, // Pastikan ini true agar penyedia terlihat
    icon: Ollama, // Gunakan ikon Ollama default, atau ganti jika Anda membuat ikon kustom
  },
  // Hapus semua entri penyedia lain di sini
];
