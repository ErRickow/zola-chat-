import { tool } from "ai"
import { z } from "zod"
import { runImageSearch } from "./run"

export const imageSearchTool = tool({
  description: "Search for specific images on the web based on a given query. Use this tool when a user asks to find pictures or images related to a topic.",
  parameters: z.object({
    query: z.string().describe("The topic or subject to search for images."),
    numResults: z
      .number()
      .int()
      .min(1)
      .max(10)
      .default(3)
      .optional()
      .describe("The maximum number of image results to return (default is 3, max is 10)."),
  }),
  async execute({ query, numResults }) {
    return await runImageSearch({ query, numResults })
  },
})