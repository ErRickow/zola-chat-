import { tool } from 'ai';
import { z } from 'zod';
import { Exa } from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

// Definisi tool untuk mendapatkan cuaca
export const getWeather = tool({
  description: 'Get the current weather conditions, including temperature, sunrise, and sunset, for a given geographical location. Use this tool when a user asks for weather information for a specific place.',
  parameters: z.object({
    latitude: z.number().describe('The latitude of the location.'),
    longitude: z.number().describe('The longitude of the location.'),
  }),
  execute: async ({ latitude, longitude }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
    );
    
    const weatherData = await response.json();
    return weatherData;
  },
});

// Definisi tool untuk pencarian web menggunakan Exa
export const search = tool({
  description: 'Search the web for current or general information. Use this tool for a broad search query to find relevant pages. The results will include titles and URLs.',
  parameters: z.object({
    query: z.string().describe('The search query or keywords to find relevant information on the web.'),
    numResults: z.number().int().min(1).max(10).default(3).describe('The number of search results to return (max 10).'),
    type: z.enum(['auto', 'neural', 'keyword']).default('auto').describe('The type of search to perform.').optional(),
    getText: z.boolean().default(true).describe('Set to true to retrieve full text content from pages.'),
    getHighlights: z.boolean().default(false).describe('Set to true to get highlighted excerpts relevant to the query.'),
    highlightQuery: z.string().optional().describe('An optional query for highlighting relevant content.'),
  }),
  execute: async ({ query, numResults, type, getText, getHighlights, highlightQuery }) => {
    try {
      const results = await exa.searchAndContents(query, {
        numResults: numResults,
        type: type,
        text: getText ? { maxCharacters: 1000 } : undefined,
        highlights: getHighlights ? { query: highlightQuery } : undefined,
      });
      
      return results.results.map(result => ({
        title: result.title,
        url: result.url,
        fullText: result.text,
        publishedDate: result.publishedDate,
        author: result.author,
      }));
    } catch (error) {
      console.error('Error during web search:', error);
      return {
        error: 'Failed to perform web search.'
      };
    }
  },
});

export const getWebContent = tool({
  description: 'Retrieve the full content of one or more specific web pages. This tool should be used after a search has returned a promising URL, not for general searches.',
  parameters: z.object({
    urls: z.array(z.string()).describe('An array of URLs to get content from.'),
    getText: z.boolean().default(true).describe('Set to true to retrieve full text content from pages.'),
    getHighlights: z.boolean().default(false).describe('Set to true to get highlighted excerpts.'),
    highlightQuery: z.string().optional().describe('An optional query for highlighting relevant content.'),
  }),
  execute: async ({ urls, getText, getHighlights, highlightQuery }) => {
    try {
      const contents = await exa.getContents(urls, {
        text: getText ? { maxCharacters: 1000 } : undefined,
        highlights: getHighlights && highlightQuery ? { query: highlightQuery } : undefined,
      });
      
      return contents.results.map(result => ({
        url: result.url,
        title: result.title,
        fullText: result.text,
        author: result.author,
        publishedDate: result.publishedDate,
      }));
    } catch (error) {
      console.error('Error getting web content:', error);
      return {
        error: 'Failed to retrieve web content.'
      };
    }
  },
});