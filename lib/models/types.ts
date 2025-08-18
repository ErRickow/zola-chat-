import { LanguageModelV1 } from "ai"

type ModelConfig = {
  id: string
  name: string
  provider: string
  providerId: string
  modelFamily ? : string
  baseProviderId: string
  
  description ? : string
  tags ? : string[]
  
  contextWindow ? : number
  inputCost ? : number
  outputCost ? : number
  priceUnit ? : string
  
  vision ? : boolean
  tools ? : boolean
  audio ? : boolean
  reasoning ? : boolean
  webSearch ? : boolean
  openSource ? : boolean
  imageGeneration ? : boolean // Tambahkan baris ini
  
  speed ? : "Fast" | "Medium" | "Slow"
  intelligence ? : "Low" | "Medium" | "High"
  
  website ? : string
  apiDocs ? : string
  modelPage ? : string
  releasedAt ? : string
  
  icon ? : string
  
  apiSdk ? : (
    apiKey ? : string,
    opts ? : { enableSearch ? : boolean }
  ) => LanguageModelV1
  
  accessible ? : boolean
}

export type { ModelConfig }