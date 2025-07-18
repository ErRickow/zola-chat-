import { tool } from 'ai';
import { z } from 'zod';
import { Exa } from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

// Definisi tool untuk mendapatkan cuaca
export const getWeather = tool({
  description: 'Get the current weather at a location',
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number(),
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
  description: 'Search the web for information and get full content from pages.',
  parameters: z.object({
    query: z.string().describe('The search query to use.'),
    numResults: z.number().int().min(1).max(10).default(3).describe('The number of search results to return (max 10).'),
    type: z.enum(['auto', 'neural', 'keyword']).default('auto').describe('The type of search to perform.').optional(),
    getText: z.boolean().default(true).describe('Whether to retrieve full text content from pages.'),
    getHighlights: z.boolean().default(false).describe('Whether to get highlighted excerpts relevant to the query.'),
    highlightQuery: z.string().optional().describe('Query for highlighting relevant content.'),
  }),
  execute: async ({ query, numResults, type, getText, getHighlights, highlightQuery }) => {
    try {
      // Use searchAndContents instead of search to get full page content
      const results = await exa.searchAndContents(query, {
        numResults: numResults,
        type: type,
        text: getText ? { maxCharacters: 1000 } : undefined,
        highlights: getHighlights ? { query: highlightQuery } : undefined,
      });
      
      return results.results.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.text ? result.text.substring(0, 500) + '...' : result.snippet,
        fullText: result.text, // This contains the full webpage content
        highlights: result.highlights,
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
  description: 'Get full content from specific web pages using their URLs.',
  parameters: z.object({
    urls: z.array(z.string()).describe('Array of URLs to get content from.'),
    getText: z.boolean().default(true).describe('Whether to retrieve full text content.'),
    getHighlights: z.boolean().default(false).describe('Whether to get highlighted excerpts.'),
    highlightQuery: z.string().optional().describe('Query for highlighting relevant content.'),
  }),
  execute: async ({ urls, getText, getHighlights, highlightQuery }) => {
    try {
      const contents = await exa.getContents(urls, {
        text: getText ? { maxCharacters: 1000 } : undefined,
        highlights: getHighlights ? { query: highlightQuery } : undefined,
      });
      
      return contents.results.map(result => ({
        url: result.url,
        title: result.title,
        fullText: result.text,
        highlights: result.highlights,
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