import { getSanitizedSchema } from './schema.js';
import { buildPrompt } from './promptBuilder.js';
import { callLlama } from './llama.service.js';
import { validateQueries } from './sqlValidator.service.js';
import { recommendQuery } from './queryRecommendation.service.js';
import { checkPromptSafety } from './promptSecurity.service.js';

/**
 * Coordinate generation of SQL query alternatives from natural language.
 */
export async function generateQueries(userRequest) {
  // 1. Run prompt injection security checks
  const security = checkPromptSafety(userRequest);
  if (!security.isSafe) {
    const error = new Error(security.reason);
    error.status = 400; // Bad Request
    throw error;
  }

  // 2. Get database schema definition
  const schema = getSanitizedSchema();

  // 3. Build the system/user instruction prompt using sanitized input query
  const basePrompt = buildPrompt(security.sanitizedQuery, schema);

  // 4. Inject strict directives requesting 3-5 alternative choices formatted as JSON
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

  // 5. Call Llama provider
  const result = await callLlama(enrichedPrompt);

  if (!result || !Array.isArray(result.queries)) {
    throw new Error('Invalid query format received from AI provider');
  }

  // 6. Pass through local SQL validation check rules
  const validated = validateQueries(result.queries);

  // 7. Compute query recommendation scores and return recommended + alternatives
  return recommendQuery(validated);
}
