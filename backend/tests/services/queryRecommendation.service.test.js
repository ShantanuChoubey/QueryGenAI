import { describe, test, expect } from 'vitest';
import { recommendQuery } from '../../src/services/queryRecommendation.service.js';

describe('Query Recommendation Service Unit Tests', () => {
  // 1. SAFE Query Recommendation
  test('1. SAFE Query Recommendation: SAFE is selected as recommended and highest score wins', () => {
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

  // 2. WARNING Recommendation
  test('2. WARNING Recommendation: When only WARNING and BLOCKED queries exist, WARNING is selected', () => {
    const alternatives = [
      { id: 1, sql: 'SELECT * FROM users JOIN depts ON id=dept_id;', riskLevel: 'WARNING', ranking: 1 }, // Score: 50
      { id: 2, sql: 'DROP TABLE users;', riskLevel: 'BLOCKED', ranking: 1 } // Score: -70
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(1);
    expect(result.recommendedQuery.riskLevel).toBe('WARNING');
  });

  // 3. BLOCKED Recommendation
  test('3. BLOCKED Recommendation: When every query is BLOCKED, the highest-ranked BLOCKED query is returned and riskLevel remains BLOCKED', () => {
    const alternatives = [
      { id: 1, sql: 'DROP TABLE users;', riskLevel: 'BLOCKED', ranking: 2 }, // Score: -100 + 20 = -80
      { id: 2, sql: 'DELETE FROM users;', riskLevel: 'BLOCKED', ranking: 1 } // Score: -100 + 30 = -70
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(2);
    expect(result.recommendedQuery.riskLevel).toBe('BLOCKED');
  });

  // 4. AI Rank Priority
  test('4. AI Rank Priority: Rank 1 wins over Rank 2 when risk levels are same', () => {
    const alternatives = [
      { id: 1, sql: 'SELECT id, name FROM users;', riskLevel: 'SAFE', ranking: 2 }, // Score: 70
      { id: 2, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 1 } // Score: 80
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(2);
  });

  // 5. Tie Breaking
  test('5. Tie Breaking: Recommendation is stable and deterministic when riskLevel and rank are identical', () => {
    const alternatives = [
      { id: 1, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 1 },
      { id: 2, sql: 'SELECT id, name FROM users;', riskLevel: 'SAFE', ranking: 1 }
    ];

    const result1 = recommendQuery(alternatives);
    const result2 = recommendQuery(alternatives);

    expect(result1.recommendedQuery).toBeDefined();
    expect(result1.recommendedQuery.id).toBe(1);
    expect(result2.recommendedQuery).toBeDefined();
    expect(result2.recommendedQuery.id).toBe(1);
  });

  // 6. Single Query
  test('6. Single Query: Single SAFE query becomes the recommendation', () => {
    const alternatives = [
      { id: 1, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 1 }
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(1);
  });

  // 7. Empty Array
  test('7. Empty Array: Graceful handling without exceptions', () => {
    const result = recommendQuery([]);
    expect(result.recommendedQuery).toBeNull();
    expect(result.alternatives).toEqual([]);
  });

  // 8. Null / Undefined
  describe('8. Null / Undefined / Object input handling', () => {
    test('should handle null gracefully', () => {
      const result = recommendQuery(null);
      expect(result.recommendedQuery).toBeNull();
      expect(result.alternatives).toEqual([]);
    });

    test('should handle undefined gracefully', () => {
      const result = recommendQuery(undefined);
      expect(result.recommendedQuery).toBeNull();
      expect(result.alternatives).toEqual([]);
    });

    test('should handle non-array object gracefully', () => {
      const result = recommendQuery({});
      expect(result.recommendedQuery).toBeNull();
      expect(result.alternatives).toEqual([]);
    });
  });

  // 9. Mixed Dataset
  test('9. Mixed Dataset: SAFE is recommended and original alternatives remain unchanged', () => {
    const alternatives = [
      { id: 1, sql: 'DROP TABLE users;', riskLevel: 'BLOCKED', ranking: 1 },
      { id: 2, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 2 },
      { id: 3, sql: 'SELECT * FROM users LIMIT 10;', riskLevel: 'WARNING', ranking: 1 }
    ];

    const result = recommendQuery(alternatives);
    expect(result.recommendedQuery).toBeDefined();
    expect(result.recommendedQuery.id).toBe(2);
    expect(result.recommendedQuery.riskLevel).toBe('SAFE');
    expect(result.alternatives).toEqual(alternatives);
  });

  // 10. Immutability
  test('10. Immutability: Verify service never mutates original input array', () => {
    const alternatives = [
      Object.freeze({ id: 1, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 2 }),
      Object.freeze({ id: 2, sql: 'SELECT id FROM users;', riskLevel: 'SAFE', ranking: 1 })
    ];
    Object.freeze(alternatives);

    expect(() => recommendQuery(alternatives)).not.toThrow();
  });

  // 11. Score Ordering
  test('11. Score Ordering: Verify SAFE score > WARNING score > BLOCKED score across boundary ranks', () => {
    // A lowest-scored SAFE query (rank 4, score 55) should win over a highest-scored WARNING query (rank 1, score 50)
    const set1 = [
      { id: 1, sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 4 }, // Score: 55
      { id: 2, sql: 'SELECT * FROM users JOIN logs ON 1=1;', riskLevel: 'WARNING', ranking: 1 } // Score: 50
    ];
    expect(recommendQuery(set1).recommendedQuery.id).toBe(1);

    // A lowest-scored WARNING query (rank 4, score 25) should win over a highest-scored BLOCKED query (rank 1, score -70)
    const set2 = [
      { id: 1, sql: 'SELECT * FROM users JOIN logs ON 1=1;', riskLevel: 'WARNING', ranking: 4 }, // Score: 25
      { id: 2, sql: 'DROP TABLE users;', riskLevel: 'BLOCKED', ranking: 1 } // Score: -70
    ];
    expect(recommendQuery(set2).recommendedQuery.id).toBe(1);
  });

  // 12. Stable Output Shape
  test('12. Stable Output Shape: Every response contains recommendedQuery and alternatives', () => {
    const resultNormal = recommendQuery([{ sql: 'SELECT * FROM users;', riskLevel: 'SAFE', ranking: 1 }]);
    expect(resultNormal).toHaveProperty('recommendedQuery');
    expect(resultNormal).toHaveProperty('alternatives');

    const resultEmpty = recommendQuery([]);
    expect(resultEmpty).toHaveProperty('recommendedQuery');
    expect(resultEmpty).toHaveProperty('alternatives');

    const resultInvalid = recommendQuery(null);
    expect(resultInvalid).toHaveProperty('recommendedQuery');
    expect(resultInvalid).toHaveProperty('alternatives');
  });
});
