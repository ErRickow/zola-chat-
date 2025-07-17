"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Link as LinkIcon } from 'lucide-react'; // Menggunakan ikon Link dari lucide-react

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchResultsProps {
  results: SearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
  if (!results || results.length === 0) {
    return null; // Tidak merender apa-apa jika tidak ada hasil
  }

  return (
    <div className={cn(
      "flex flex-col gap-3 p-4 rounded-lg border border-border bg-card shadow-sm",
      "max-w-full overflow-hidden"
    )}>
      <h3 className="text-lg font-semibold text-foreground mb-2">Search Results:</h3>
      <ul className="flex flex-col gap-3">
        {results.map((result, index) => (
          <li key={index} className="flex flex-col gap-1">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-2 text-base font-medium"
            >
              <LinkIcon className="size-4 flex-shrink-0" />
              <span className="truncate">{result.title}</span>
            </a>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {result.snippet}
            </p>
            <span className="text-xs text-blue-400 truncate">{result.url}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
