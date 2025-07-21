// This file will now only contain your Neosantara model definitions.
// We use "ollama" as the internal providerId so that Zola uses OLLAMA_BASE_URL.

import { openproviders } from "@/lib/openproviders";
import { ModelConfig } from "../types";

// Function to get the Ollama base URL (which will now be your Neosantara API)
const getOllamaBaseURL = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434";
  }
  return process.env.OLLAMA_BASE_URL?.replace(/\/+$/, "") || "http://localhost:11434";
};

// Function to create an Ollama provider instance (which now calls your Neosantara API)
// This is a wrapper for createOpenAI which actually resides in lib/openproviders/index.ts
// We don't need to re-declare apiKey here because it's already handled in openproviders/index.ts
const createOllamaProviderInstance = () => {
  return openproviders.createOpenAI({
    baseURL: `${getOllamaBaseURL()}/v1`,
    apiKey: "dummy-key", // This key will be replaced by the one in lib/openproviders/index.ts
    name: "neosantara",
  });
};


// Definition of your Neosantara models
const neosantaraModels: ModelConfig[] = [
  {
    id: "nusantara-base",
    name: "Nusantara Base",
    provider: "Neosantara",
    providerId: "ollama", // IMPORTANT: Keep this so Zola uses OLLAMA_BASE_URL
    modelFamily: "Nusantara",
    baseProviderId: "ollama", // Keep this for the default Ollama icon or change if there's a custom icon
    description: "Base model for general tasks with balanced performance and speed.",
    tags: ["fast", "web-search"],
    contextWindow: 64000,
    inputCost: 0.0,
    outputCost: 0.0,
    priceUnit: "free",
    vision: false,
    tools: true,
    audio: false,
    reasoning: false,
    openSource: false, // Adjust
    speed: "Fast", // Adjust
    intelligence: "Mid", // Adjust
    website: "https://neosantara.xyz", // Replace with your documentation/site URL
    apiDocs: "https://docs.neosantara.xyz", // Replace with your API documentation URL
    modelPage: "https://www.neosantara.xyz/models", // Replace with your model page URL
    icon: "ollama", // Uses the default Ollama icon, or change if you create a custom icon
    apiSdk: (apiKey?: string) =>
      openproviders(
        "nusantara-base" as string,
        undefined,
        apiKey // Passes the apiKey which might come from BYOK (if re-enabled)
      ),
  },
  {
    id: "archipelago-7b",
    name: "Archipelago 7B",
    provider: "Neosantara",
    providerId: "ollama",
    modelFamily: "Archipelago",
    baseProviderId: "ollama",
    description: "Specialized model for Indonesian language content with cultural context awareness.",
    tags: ["pro", "web-sewrch", "testing"],
    contextWindow: 4096,
    inputCost: 0.0,
    outputCost: 0.0,
    priceUnit: "pro",
    vision: false,
    tools: false,
    audio: false,
    reasoning: false,
    openSource: false,
    speed: "Medium",
    intelligence: "High",
    website: "https://neosantara.xyz",
    apiDocs: "https://docs.neosantara.xyz",
    modelPage: "https://neosantara.xyz/models",
    icon: "ollama",
    apiSdk: (apiKey?: string) =>
      openproviders(
        "archipelago-7b" as string,
        undefined,
        apiKey
      ),
  },
  {
    id: "bahasa-llm",
    name: "Bahasa LLM",
    provider: "Neosantara",
    providerId: "ollama",
    modelFamily: "Bahasa",
    baseProviderId: "ollama",
    description: "The Bahasa LLM model from Neosantara AI.",
    tags: ["pro", "testing", "text-generation"],
    contextWindow: 65536,
    inputCost: 0.0,
    outputCost: 0.0,
    priceUnit: "pro",
    vision: false,
    tools: true,
    audio: false,
    reasoning: true,
    openSource: false,
    speed: "slow",
    intelligence: "High",
    website: "https://neosantara.xyz",
    apiDocs: "https://docs.neosantara.xyz",
    modelPage: "https://neosantara.xyz/models",
    icon: "ollama",
    apiSdk: (apiKey?: string) =>
      openproviders(
        "bahasa-llm" as string,
        undefined,
        apiKey
      ),
  },
];

// Function to get Ollama models (which are now your Neosantara models)
export async function getOllamaModels(): Promise<ModelConfig[]> {
  return neosantaraModels;
}

// For backward compatibility, export static models
export const ollamaModels = neosantaraModels;