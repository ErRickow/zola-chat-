// Berkas ini sekarang hanya akan berisi entri untuk penyedia "Neosantara" (sebelumnya Ollama)

import NeosantaraLogo from "@/components/icons/neosantara";

export type Provider = {
  id: string;
  name: string;
  available: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export const PROVIDERS: Provider[] = [
  {
    id: "ollama", // PENTING: Pertahankan ID internal ini sebagai "ollama"
    name: "Neosantara AI",
    available: true, // Pastikan ini true agar penyedia terlihat
    icon: NeosantaraLogo,
  },
  // Hapus semua entri penyedia lain di sini
];
