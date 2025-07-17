import { tool } from 'ai';
import { z } from 'zod';
import { Exa } from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

// Definisi tool untuk mendapatkan cuaca
export const getWeather = tool({
  description: 'Get the current weather at a location',
  inputSchema: z.object({
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
  description: 'Search the web for information using a given query.',
  inputSchema: z.object({
    query: z.string().describe('The search query to use.'),
    numResults: z.number().int().min(1).max(10).default(5).describe('The number of search results to return (max 10).'),
  }),
  execute: async ({ query, numResults }) => {
    try {
      // Lakukan pencarian menggunakan Exa
      const results = await exa.search(query, {
        numResults: numResults,
        // includeContents: true, // Untuk mendapatkan konten halaman secara langsung
      });

      // Kembalikan hasil pencarian
      // Kita hanya mengembalikan snippet dan URL untuk kesederhanaan
      return results.results.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
      }));
    } catch (error) {
      console.error('Error during web search:', error);
      return { error: 'Failed to perform web search.' };
    }
  },
});
