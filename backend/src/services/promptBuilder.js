/**
 * Build a token-efficient system instruction prompt combining the user request
 * and the database structural schema context.
 */
export function buildPrompt(userRequest, sanitizedSchema) {
  const schemaString = JSON.stringify(sanitizedSchema, null, 2);

  return `You are an AI assistant specialized in translating natural language questions into PostgreSQL queries.

---
DATABASE SCHEMA CONTEXT (Tables, Columns, Relationships):
${schemaString}
---

USER REQUEST:
"${userRequest}"

---
INSTRUCTIONS:
1. Translate the user request into between 3 and 5 alternative syntactically correct and optimized PostgreSQL SELECT queries.
2. Only reference tables and columns defined in the schema above.
3. Write only SELECT queries. Never include INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or any data-modification statements.
4. You MUST respond with a valid JSON object. Do not include any explanatory text before or after the JSON.
5. The JSON object must match this exact schema:
{
  "queries": [
    {
      "sql": "SELECT ...",
      "explanation": "Brief explanation of this alternative",
      "ranking": 1
    }
  ]
}
6. ranking must be an integer starting from 1 (best) to N (least preferred).
7. Do NOT wrap the JSON in markdown code fences or backticks.`;
}
