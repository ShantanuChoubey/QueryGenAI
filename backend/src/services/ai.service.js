import { getSanitizedSchema } from './schema.js';
import { buildPrompt } from './promptBuilder.js';
import { callLlama } from './llama.service.js';

/**
 * Coordinate generation of SQL query alternatives from natural language.
 */
export async function generateQueries(userRequest) {
  // 1. Get database schema definition
  const schema = getSanitizedSchema();

  // 2. Build the system/user instruction prompt
  const basePrompt = buildPrompt(userRequest, schema);

  // 3. Inject strict directives requesting 3-5 alternative choices formatted as JSON
  const enrichedPrompt = `${basePrompt}

CRITICAL FORMATTING INSTRUCTIONS:
- You must generate between 3 and 5 query alternatives.
- You must respond with a JSON object matching this schema exactly:
{
  "queries": [
    {
      "sql": "SELECT ...",
      "explanation": "Brief explanation of this alternative",
      "ranking": 1
    }
  ]
}`;

  // 4. Call Llama provider
  const result = await callLlama(enrichedPrompt);

  if (!result || !Array.isArray(result.queries)) {
    throw new Error('Invalid query format received from AI provider');
  }

  return result.queries;
}
