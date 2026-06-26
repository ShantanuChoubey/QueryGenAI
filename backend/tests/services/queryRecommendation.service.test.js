import { describe, test, expect } from 'vitest';
import { recommendQuery } from '../../src/services/queryRecommendation.service.js';

describe('Query Recommendation Service Unit Tests', () => {
  // 1. SAFE Query Scoring
  test('1. SAFE query should rank above WARNING and BLOCKED queries', () => {
    const alternatives = [
      { id: 1, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 3 }, // Score: 50 + 10 = 60
      { id: 2, sql: 'SELECT * FROM users JOIN depts ON id=dept_id;', riskLevel: 'WARNING', ranking: 1 }, // Score: 20 + 30 = 50
      { id: 3, sql: 'DROP TABLE users;', riskLevel: 'BLOCKED', ranking: 1 } // Score: -100 + 30 = -70
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(1);
    expect(result.recommendedQuery.riskLevel).toBe('SAFE');
  });

  // 2. WARNING Query Scoring
  test('2. WARNING query should rank above BLOCKED query', () => {
    const alternatives = [
      { id: 1, sql: 'SELECT * FROM users JOIN depts ON id=dept_id;', riskLevel: 'WARNING', ranking: 1 }, // Score: 20 + 30 = 50
      { id: 2, sql: 'DROP TABLE users;', riskLevel: 'BLOCKED', ranking: 1 } // Score: -100 + 30 = -70
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(1);
    expect(result.recommendedQuery.riskLevel).toBe('WARNING');
  });

  // 3. BLOCKED Query Scoring
  test('3. BLOCKED queries are never recommended if SAFE/WARNING alternatives exist', () => {
    const alternatives = [
      { id: 1, sql: 'DROP TABLE users;', riskLevel: 'BLOCKED', ranking: 1 }, // Score: -100 + 30 = -70
      { id: 2, sql: 'SELECT * FROM users LIMIT 10;', riskLevel: 'WARNING', ranking: 4 } // Score: 20 + 5 = 25
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(2);
    expect(result.recommendedQuery.riskLevel).toBe('WARNING');
  });

  // 4. AI Rank Priority
  test('4. AI ranking should resolve ties of same riskLevel', () => {
    const alternatives = [
      { id: 1, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 2 }, // Score: 50 + 20 = 70
      { id: 2, sql: 'SELECT id, name FROM users;', riskLevel: 'SAFE', ranking: 1 } // Score: 50 + 30 = 80
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(2);
    expect(result.recommendedQuery.ranking).toBe(1);
  });

  // 5. Tie Breaking
  test('5. Stable recommendation when riskLevel and AI rank are identical', () => {
    const alternatives = [
      { id: 1, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 1 }, // Score: 80
      { id: 2, sql: 'SELECT id, name FROM users;', riskLevel: 'SAFE', ranking: 1 } // Score: 80
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(1); // Should select the first match (stable)
  });

  // 6. Single Query
  test('6. Single SAFE query should be returned as recommended', () => {
    const alternatives = [
      { id: 1, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 1 }
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(1);
  });

  // 7. Empty Alternatives
  test('7. Empty array input should be handled gracefully', () => {
    const result = recommendQuery([]);
    expect(result.recommendedQuery).toBeNull();
    expect(result.alternatives).toEqual([]);
  });

  // 8. Invalid Input
  describe('8. Invalid Inputs', () => {
    test('should return graceful output on null', () => {
      const result = recommendQuery(null);
      expect(result).toEqual({ recommendedQuery: null, alternatives: [] });
    });

    test('should return graceful output on undefined', () => {
      const result = recommendQuery(undefined);
      expect(result).toEqual({ recommendedQuery: null, alternatives: [] });
    });

    test('should return graceful output on non-array object', () => {
      const result = recommendQuery({});
      expect(result).toEqual({ recommendedQuery: null, alternatives: [] });
    });
  });

  // 9. Mixed Dataset
  test('9. Mixed dataset should select correct SAFE query and keep list unchanged', () => {
    const alternatives = [
      { id: 1, sql: 'DROP TABLE users;', riskLevel: 'BLOCKED', ranking: 1 },
      { id: 2, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 2 },
      { id: 3, sql: 'SELECT * FROM users JOIN logs ON users.id=logs.uid;', riskLevel: 'WARNING', ranking: 1 }
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(2);
    expect(result.recommendedQuery.riskLevel).toBe('SAFE');
    expect(result.alternatives).toEqual(alternatives);
  });

  // 10. Immutability
  test('10. Should not mutate the input array or items', () => {
    const alternatives = [
      Object.freeze({ id: 1, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 2 }),
      Object.freeze({ id: 2, sql: 'SELECT id FROM users;', riskLevel: 'SAFE', ranking: 1 })
    ];
    Object.freeze(alternatives);

    expect(() => recommendQuery(alternatives)).not.toThrow();
  });
});
