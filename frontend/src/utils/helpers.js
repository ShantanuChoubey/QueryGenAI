/**
 * Helper to safely format or sanitize queries or response outputs.
 */
export function formatSql(sqlString) {
  if (!sqlString) return '';
  return sqlString.trim();
}

/**
 * Common formatting for API dates.
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
