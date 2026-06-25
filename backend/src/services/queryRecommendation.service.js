/**
 * Evaluates the scores of validated SQL query choices based on safety and ranking.
 * Returns the single recommended query alongside the original alternatives.
 */
export function recommendQuery(validatedQueries) {
  if (!Array.isArray(validatedQueries) || validatedQueries.length === 0) {
    return {
      recommendedQuery: null,
      alternatives: [],
    };
  }

  let bestQuery = null;
  let highestScore = -Infinity;

  // We keep the loop deterministic. In case of matching highest scores,
  // the query appearing first in the list remains recommended.
  for (const query of validatedQueries) {
    let score = 0;

    // 1. Risk Level Points
    if (query.riskLevel === 'SAFE') {
      score += 50;
    } else if (query.riskLevel === 'WARNING') {
      score += 20;
    } else if (query.riskLevel === 'BLOCKED') {
      score += -100;
    }

    // 2. Ranking Points
    const rank = query.ranking;
    if (rank === 1) {
      score += 30;
    } else if (rank === 2) {
      score += 20;
    } else if (rank === 3) {
      score += 10;
    } else if (rank === 4) {
      score += 5;
    }

    if (score > highestScore) {
      highestScore = score;
      bestQuery = query;
    }
  }

  return {
    recommendedQuery: bestQuery,
    alternatives: validatedQueries,
  };
}
