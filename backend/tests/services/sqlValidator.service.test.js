import { describe, test, expect } from 'vitest';
import { validateQueries } from '../../src/services/sqlValidator.service.js';

describe('SQL Validator Service', () => {
  // 1. SAFE Queries
  describe('SAFE Queries', () => {
    test('should validate simple SELECT query as SAFE', () => {
      const input = [{ sql: 'SELECT * FROM employees;' }];
      const output = validateQueries(input);
      expect(output).toHaveLength(1);
      expect(output[0].isValid).toBe(true);
      expect(output[0].riskLevel).toBe('SAFE');
      expect(output[0].blockedReason).toBeNull();
    });

    test('should validate query selecting specific columns as SAFE', () => {
      const input = [{ sql: 'SELECT id, name FROM users;' }];
      const output = validateQueries(input);
      expect(output).toHaveLength(1);
      expect(output[0].isValid).toBe(true);
      expect(output[0].riskLevel).toBe('SAFE');
      expect(output[0].blockedReason).toBeNull();
    });
  });

  // 2. WARNING Queries
  describe('WARNING Queries', () => {
    const warningQueries = [
      { sql: 'SELECT * FROM employees JOIN departments ON id = dept_id;', type: 'JOIN' },
      { sql: 'SELECT category, COUNT(*) FROM products GROUP BY category;', type: 'GROUP BY' },
      { sql: 'SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 5;', type: 'HAVING' },
      { sql: 'SELECT * FROM users ORDER BY created_at DESC;', type: 'ORDER BY' },
      { sql: 'SELECT * FROM users LIMIT 10;', type: 'LIMIT' },
      { sql: 'WITH regional_sales AS (SELECT * FROM sales) SELECT * FROM regional_sales;', type: 'WITH' }
    ];

    warningQueries.forEach(({ sql, type }) => {
      test(`should flag query containing ${type} as WARNING`, () => {
        const input = [{ sql }];
        const output = validateQueries(input);
        expect(output).toHaveLength(1);
        expect(output[0].isValid).toBe(true);
        expect(output[0].riskLevel).toBe('WARNING');
        expect(output[0].blockedReason).toBeNull();
      });
    });
  });

  // 3. BLOCKED Queries
  describe('BLOCKED Queries', () => {
    const blockedQueries = [
      { sql: 'DROP TABLE users;', keyword: 'DROP' },
      { sql: 'DELETE FROM users WHERE id = 1;', keyword: 'DELETE' },
      { sql: 'UPDATE users SET email = "test@example.com";', keyword: 'UPDATE' },
      { sql: 'INSERT INTO users (id, name) VALUES (1, "Alice");', keyword: 'INSERT' },
      { sql: 'ALTER TABLE users ADD COLUMN phone VARCHAR;', keyword: 'ALTER' },
      { sql: 'TRUNCATE TABLE logs;', keyword: 'TRUNCATE' },
      { sql: 'CREATE TABLE logs (id INT);', keyword: 'CREATE' },
      { sql: 'GRANT ALL PRIVILEGES ON database TO admin;', keyword: 'GRANT' },
      { sql: 'REVOKE SELECT ON employees FROM public;', keyword: 'REVOKE' },
      { sql: 'EXECUTE run_script;', keyword: 'EXEC' },
      { sql: 'CALL start_workflow();', keyword: 'CALL' }
    ];

    blockedQueries.forEach(({ sql, keyword }) => {
      test(`should block query containing ${keyword}`, () => {
        const input = [{ sql }];
        const output = validateQueries(input);
        expect(output).toHaveLength(1);
        expect(output[0].isValid).toBe(false);
        expect(output[0].riskLevel).toBe('BLOCKED');
        expect(output[0].blockedReason).toBe(`Blocked keyword detected: ${keyword}`);
      });
    });
  });

  // 4. Comments
  describe('Blocked Keywords inside Comments', () => {
    test('should allow queries where blocked keywords are in single-line comments', () => {
      const input = [
        {
          sql: `-- DROP TABLE users; \nSELECT * FROM employees;`
        }
      ];
      const output = validateQueries(input);
      expect(output).toHaveLength(1);
      expect(output[0].isValid).toBe(true);
      expect(output[0].riskLevel).toBe('SAFE');
    });

    test('should allow queries where blocked keywords are in multi-line comments', () => {
      const input = [
        {
          sql: `/* DROP TABLE users; \n DELETE FROM accounts; */ SELECT * FROM employees;`
        }
      ];
      const output = validateQueries(input);
      expect(output).toHaveLength(1);
      expect(output[0].isValid).toBe(true);
      expect(output[0].riskLevel).toBe('SAFE');
    });
  });

  // 5. Quoted Strings
  describe('Blocked Keywords inside Quoted Strings', () => {
    test('should allow blocked keywords inside single-quoted strings', () => {
      const input = [{ sql: "SELECT 'DROP TABLE users';" }];
      const output = validateQueries(input);
      expect(output).toHaveLength(1);
      expect(output[0].isValid).toBe(true);
      expect(output[0].riskLevel).toBe('SAFE');
    });

    test('should allow blocked keywords inside dollar-quoted strings', () => {
      const input = [{ sql: "SELECT $$DELETE FROM users$$;" }];
      const output = validateQueries(input);
      expect(output).toHaveLength(1);
      expect(output[0].isValid).toBe(true);
      expect(output[0].riskLevel).toBe('SAFE');
    });
  });

  // 6. Mixed Queries
  describe('Mixed Safe and Unsafe Queries', () => {
    test('should block multiple combined queries if one is blocked', () => {
      const input = [{ sql: 'SELECT * FROM users; DROP TABLE users;' }];
      const output = validateQueries(input);
      expect(output).toHaveLength(1);
      expect(output[0].isValid).toBe(false);
      expect(output[0].riskLevel).toBe('BLOCKED');
    });
  });

  // 7. Empty Input
  describe('Empty and Invalid Inputs to validateQueries', () => {
    test('should return empty array when queries is empty string', () => {
      expect(validateQueries('')).toEqual([]);
    });

    test('should return empty array when queries is null', () => {
      expect(validateQueries(null)).toEqual([]);
    });

    test('should return empty array when queries is undefined', () => {
      expect(validateQueries(undefined)).toEqual([]);
    });

    test('should return empty array when queries is not an array', () => {
      expect(validateQueries({})).toEqual([]);
    });
  });

  // 8. Invalid Objects
  describe('Invalid Query Object Shapes', () => {
    test('should handle objects missing the sql field gracefully', () => {
      const input = [{ otherField: 'some text' }];
      const output = validateQueries(input);
      expect(output).toHaveLength(1);
      expect(output[0].isValid).toBe(true);
      expect(output[0].riskLevel).toBe('SAFE');
      expect(output[0].otherField).toBe('some text');
    });

    test('should handle query objects with empty sql values gracefully', () => {
      const input = [{ sql: '' }];
      const output = validateQueries(input);
      expect(output).toHaveLength(1);
      expect(output[0].isValid).toBe(true);
      expect(output[0].riskLevel).toBe('SAFE');
    });
  });
});
