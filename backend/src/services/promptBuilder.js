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
1. Translate the user request into a syntactically correct and optimized PostgreSQL query.
2. Only reference tables and columns defined in the schema above.
3. Write standard SELECT queries. Avoid modifications, inserts, updates, or deletions.
4. Output ONLY the raw SQL query string. Do not include markdown wraps or block syntax.`;
}
