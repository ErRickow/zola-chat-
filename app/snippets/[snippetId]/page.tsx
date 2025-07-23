import { notFound } from "next/navigation";
import { APP_DOMAIN } from "@/lib/config";
import {
  CodeBlockCode,
  CodeBlock,
  CodeBlockGroup
} from "@/components/prompt-kit/code-block";

// Definisi tipe untuk data snippet
interface CodeSnippetData {
  id: string;
  code_content: string;
  language: string;
  title?: string;
  description?: string;
  user_id: string;
  created_at: string;
  is_public: boolean;
}

async function getCodeSnippet(snippetId: string): Promise<CodeSnippetData | null> {
  try {
    const response = await fetch(
      `${APP_DOMAIN}/api/code-snippets?id=${snippetId}`,
      { cache: "no-store" } // Pastikan data selalu terbaru
    );

    if (response.status === 404 || response.status === 403) {
      return null; // Tidak ditemukan atau tidak diizinkan oleh RLS
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch snippet: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching code snippet in page:", error);
    return null;
  }
}

// KOREKSI UTAMA DI SINI: Memaksa `params` menjadi tipe Promise
export default async function SnippetPage({
  params,
}: {
  // Memaksa params menjadi Promise<...> sesuai dengan pesan error
  params: Promise<{ snippetId: string }>;
}) {
  // Meng-await params karena sekarang didefinisikan sebagai Promise
  const { snippetId } = await params;

  const snippet = await getCodeSnippet(snippetId);

  if (!snippet) {
    notFound(); // Tampilkan halaman 404 jika snippet tidak ditemukan atau tidak diizinkan
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <h1 className="text-2xl font-bold mb-4">
        Shared Code Snippet: {snippet.title || "Untitled"}
      </h1>
      {snippet.description && (
        <p className="text-muted-foreground mb-6">{snippet.description}</p>
      )}

      <div className="w-full max-w-3xl">
        <CodeBlock>
            <CodeBlockGroup className="flex h-9 items-center justify-between px-4 rounded-t-xl bg-muted/50">
                <div className="text-muted-foreground py-1 pr-2 font-mono text-xs">
                    {snippet.language}
                    <span className="ml-2 text-primary">ID: {snippet.id.substring(0, 8)}...</span>
                </div>
            </CodeBlockGroup>
            <CodeBlockCode
                code={snippet.code_content}
                language={snippet.language}
                readOnly={true}
                showHeader={false}
                snippetId={snippet.id}
            />
        </CodeBlock>
        <p className="mt-4 text-sm text-muted-foreground">
          Shared by User ID: {snippet.user_id.substring(0, 8)}... on{" "}
          {new Date(snippet.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}