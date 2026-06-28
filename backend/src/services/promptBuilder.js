/**
 * Build a fallback prompt using the static database schema definition
 * to preserve backward compatibility.
 */
function buildFallbackPrompt(userRequest, sanitizedSchema) {
  const schemaString = sanitizedSchema ? JSON.stringify(sanitizedSchema, null, 2) : '{}';

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

/**
 * Build a token-efficient system instruction prompt combining the user request,
 * workspace metadata, and custom Schema context.
 *
 * @param {string} userRequest - Natural language request
 * @param {Object} schemaContext - Structured workspace schema metadata
 * @param {Object} [fallbackSchema] - Fallback static schema (optional)
 * @returns {string} The fully compiled instruction prompt
 */
export function buildPrompt(userRequest, schemaContext, fallbackSchema) {
  if (!schemaContext) {
    return buildFallbackPrompt(userRequest, fallbackSchema);
  }

  const { workspaceName, databaseType, tables, relationships } = schemaContext;

  const tablesSection = tables
    .map((t) => {
      const colStrings = t.columns
        .map((c) => {
          const pk = c.primaryKey ? ' PRIMARY KEY' : '';
          const uq = c.unique ? ' UNIQUE' : '';
          const nn = !c.nullable ? ' NOT NULL' : '';
          const df = c.defaultValue ? ` DEFAULT ${c.defaultValue}` : '';
          return `    - ${c.name} (${c.dataType})${pk}${uq}${nn}${df}`;
        })
        .join('\n');
      const desc = t.description ? ` (${t.description})` : '';
      return `- Table: ${t.name}${desc}\n  Columns:\n${colStrings}`;
    })
    .join('\n\n');

  const relsSection = relationships
    .map(
      (r) =>
        `- ${r.sourceTable}.${r.sourceColumn} (${r.relationshipType}) -> ${r.targetTable}.${r.targetColumn}`
    )
    .join('\n');

  return `You are an AI assistant specialized in translating natural language questions into syntactically correct SQL queries.

WORKSPACE DETAILS:
- Name: ${workspaceName}
- Target Database Engine: ${databaseType}

SCHEMA DEFINITION (TABLES & COLUMNS):
${tablesSection || '(No tables defined in workspace)'}

RELATIONSHIPS (FOREIGN KEYS):
${relsSection || '(No foreign keys configured)'}

GENERATION RULES:
1. Translate the user request into between 3 and 5 alternative syntactically correct and optimized SELECT queries targeting the ${databaseType} database engine.
2. Only reference tables and columns defined in the schema above. Do not invent tables or columns.
3. Write only SELECT queries. Never write INSERT, UPDATE, DELETE, ALTER, DROP, or other schema/data modifications.
4. You MUST respond with a valid JSON object. Do not include markdown code fences or backticks.
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

USER REQUEST:
"${userRequest}"`;
}
