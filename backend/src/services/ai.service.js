import { getSanitizedSchema } from './schema.js';
import { generateSchemaContext } from './schemaContext.service.js';
import { buildPrompt } from './promptBuilder.js';
import { callGemini } from './gemini.service.js';
import { validateQueries } from './sqlValidator.service.js';
import { recommendQuery } from './queryRecommendation.service.js';
import { checkPromptSafety } from './promptSecurity.service.js';

/**
 * Coordinate generation of SQL query alternatives from natural language.
 */
export async function generateQueries(userRequest, workspaceId = null) {
  // 1. Run prompt injection security checks
  const security = checkPromptSafety(userRequest);
  if (!security.isSafe) {
    const error = new Error(security.reason);
    error.status = 400; // Bad Request
    throw error;
  }

  // 2. Fetch schema context or fallback schema
  let schemaContext = null;
  let fallbackSchema = null;

  if (workspaceId) {
    schemaContext = await generateSchemaContext(workspaceId);
    if (!schemaContext) {
      const error = new Error('Workspace not found');
      error.status = 404;
      throw error;
    }
  } else {
    fallbackSchema = getSanitizedSchema();
  }

  // 3. Build the fully-formed prompt
  const prompt = buildPrompt(security.sanitizedQuery, schemaContext, fallbackSchema);

  // 4. Call Gemini — returns a parsed JSON object { queries: [...] }
  const result = await callGemini(prompt);

  if (!result || !Array.isArray(result.queries)) {
    throw new Error('Invalid query format received from AI provider');
  }

  // 5. Pass through local SQL validation check rules
  const validated = validateQueries(result.queries);

  // 6. Compute query recommendation scores and return recommended + alternatives
  return recommendQuery(validated);
}
