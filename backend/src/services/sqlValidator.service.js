/**
 * Helper to strip SQL comments and string literals to prevent false positive keyword detections.
 */
function cleanSqlString(sql) {
  if (!sql) return '';

  // 1. Remove multi-line comments: /* ... */
  let cleaned = sql.replace(/\/\*[\s\S]*?\*\//g, ' ');

  // 2. Remove single-line comments: -- ...
  cleaned = cleaned.replace(/--.*$/gm, ' ');

  // 3. Remove standard single-quoted string literals: '...'
  cleaned = cleaned.replace(/'([^'\\]|\\.)*'/g, "''");

  // 4. Remove dollar-quoted string literals (PostgreSQL specific): $$...$$
  cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, "''");

  return cleaned;
}

/**
 * Validate an array of query objects against access and security rules.
 */
export function validateQueries(queries) {
  if (!Array.isArray(queries)) return [];

  // Keywords defined by system security rules
  const blockedRules = [
    { regex: /\bDROP\b/i, name: 'DROP' },
    { regex: /\bDELETE\b/i, name: 'DELETE' },
    { regex: /\bUPDATE\b/i, name: 'UPDATE' },
    { regex: /\bINSERT\b/i, name: 'INSERT' },
    { regex: /\bALTER\b/i, name: 'ALTER' },
    { regex: /\bTRUNCATE\b/i, name: 'TRUNCATE' },
    { regex: /\bCREATE\b/i, name: 'CREATE' },
    { regex: /\bGRANT\b/i, name: 'GRANT' },
    { regex: /\bREVOKE\b/i, name: 'REVOKE' },
    { regex: /\bEXEC\b/i, name: 'EXEC' },
    { regex: /\bCALL\b/i, name: 'CALL' },
  ];

  const warningRules = [
    { regex: /\bWITH\b/i, name: 'WITH' },
    { regex: /\bJOIN\b/i, name: 'JOIN' },
    { regex: /\bGROUP\s+BY\b/i, name: 'GROUP BY' },
    { regex: /\bHAVING\b/i, name: 'HAVING' },
    { regex: /\bORDER\s+BY\b/i, name: 'ORDER BY' },
    { regex: /\bLIMIT\b/i, name: 'LIMIT' },
  ];

  return queries.map((queryObj) => {
    const rawSql = queryObj.sql || '';
    const cleanedSql = cleanSqlString(rawSql);

    let isValid = true;
    let riskLevel = 'SAFE';
    let blockedReason = null;

    // 1. Check for blocked queries
    for (const rule of blockedRules) {
      if (rule.regex.test(cleanedSql)) {
        isValid = false;
        riskLevel = 'BLOCKED';
        blockedReason = `Blocked keyword detected: ${rule.name}`;
        break;
      }
    }

    // 2. If not blocked, check for warning clauses
    if (isValid) {
      for (const rule of warningRules) {
        if (rule.regex.test(cleanedSql)) {
          riskLevel = 'WARNING';
          break; // Stop check after first warning match
        }
      }
    }

    return {
      ...queryObj,
      isValid,
      riskLevel,
      blockedReason,
    };
  });
}
