"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CodeBlockFullScreenContextType {
  isFullScreenCodeBlockOpen: boolean;
  setIsFullScreenCodeBlockOpen: (isOpen: boolean) => void;
}

const CodeBlockFullScreenContext = createContext <
  CodeBlockFullScreenContextType | undefined >
  (undefined);

export function CodeBlockFullScreenProvider({ children }: { children: ReactNode }) {
  const [isFullScreenCodeBlockOpen, setIsFullScreenCodeBlockOpen] = useState(false);
  
  return (
    <CodeBlockFullScreenContext.Provider
      value={{ isFullScreenCodeBlockOpen, setIsFullScreenCodeBlockOpen }}
    >
      {children}
    </CodeBlockFullScreenContext.Provider>
  );
}

export function useCodeBlockFullScreen() {
  const context = useContext(CodeBlockFullScreenContext);
  if (context === undefined) {
    throw new Error(
      "useCodeBlockFullScreen must be used within a CodeBlockFullScreenProvider"
    );
  }
  return context;
}