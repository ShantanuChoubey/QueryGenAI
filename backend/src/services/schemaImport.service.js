import prisma from '../config/db.js';
import { getWorkspace } from './workspace.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// Canonical data type mapping
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_TYPES = new Set([
  'TEXT', 'VARCHAR', 'INTEGER', 'BIGINT', 'DECIMAL', 'BOOLEAN',
  'DATE', 'TIMESTAMP', 'UUID', 'JSON', 'FLOAT', 'DOUBLE',
  'SERIAL', 'BIGSERIAL',
]);

/**
 * Map raw SQL type strings (including length variants) to canonical system types.
 * Unknown types default to TEXT with a warning.
 */
export function normaliseDataType(raw) {
  if (!raw) return { type: 'TEXT', warning: null };
  const upper = raw.toUpperCase().trim();

  // Strip length/precision: VARCHAR(255) → VARCHAR
  const base = upper.replace(/\s*\(.*\)/, '').trim();

  if (CANONICAL_TYPES.has(base)) return { type: base, warning: null };

  // Alias mapping
  const aliases = {
    INT: 'INTEGER', INT2: 'INTEGER', INT4: 'INTEGER', INT8: 'BIGINT',
    SMALLINT: 'INTEGER', MEDIUMINT: 'INTEGER', TINYINT: 'INTEGER',
    NUMERIC: 'DECIMAL', REAL: 'FLOAT', DOUBLE_PRECISION: 'DOUBLE',
    CHARACTER_VARYING: 'VARCHAR', CHARACTER: 'VARCHAR', CHAR: 'VARCHAR',
    NVARCHAR: 'VARCHAR', NCHAR: 'VARCHAR',
    DATETIME: 'TIMESTAMP', DATETIME2: 'TIMESTAMP', SMALLDATETIME: 'TIMESTAMP',
    TIMESTAMPTZ: 'TIMESTAMP', TIMESTAMP_WITH_TIME_ZONE: 'TIMESTAMP',
    BOOL: 'BOOLEAN', BIT: 'BOOLEAN',
    JSONB: 'JSON', JSONTEXT: 'JSON',
    UNIQUEIDENTIFIER: 'UUID',
    CLOB: 'TEXT', NTEXT: 'TEXT', NCLOB: 'TEXT', LONGTEXT: 'TEXT', MEDIUMTEXT: 'TEXT',
    BLOB: 'TEXT', BYTEA: 'TEXT',
    AUTOINCREMENT: 'SERIAL', AUTO_INCREMENT: 'SERIAL',
    IDENTITY: 'BIGSERIAL',
  };

  // Normalise spaces/dashes
  const normalised = base.replace(/[-\s]+/g, '_');
  const mapped = aliases[normalised];
  if (mapped) return { type: mapped, warning: null };

  return { type: 'TEXT', warning: `Unknown data type "${raw}" mapped to TEXT` };
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL DDL Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse PostgreSQL (and compatible) DDL text into a ParsedSchema structure.
 * Only schema metadata is extracted. No data rows are ever parsed.
 *
 * @param {string} ddl
 * @returns {{ tables: ParsedTable[], relationships: ParsedRelationship[], warnings: string[] }}
 */
export function parseSqlDDL(ddl) {
  const tables = [];
  const relationships = [];
  const warnings = [];

  // Remove SQL line comments (-- ...) and block comments (/* ... */)
  const cleaned = ddl
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const cleanedUpper = cleaned.toUpperCase();
  let searchIdx = 0;

  while (true) {
    const startIdx = cleanedUpper.indexOf('CREATE TABLE', searchIdx);
    if (startIdx === -1) break;

    // Find the opening parenthesis of this CREATE TABLE definition
    const openParenIdx = cleaned.indexOf('(', startIdx);
    if (openParenIdx === -1) {
      searchIdx = startIdx + 12;
      continue;
    }

    // Parse the table name from the substring between "CREATE TABLE" and the opening parenthesis
    const header = cleaned.slice(startIdx, openParenIdx);
    const headerMatch = header.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["']?(\w+)["']?\.)?["']?(\w+)["']?/i);
    if (!headerMatch) {
      searchIdx = openParenIdx + 1;
      continue;
    }
    const tableName = headerMatch[2];

    // Count parentheses to find the matching closing parenthesis of the CREATE TABLE block
    let depth = 1;
    let closeParenIdx = -1;
    for (let i = openParenIdx + 1; i < cleaned.length; i++) {
      if (cleaned[i] === '(') depth++;
      else if (cleaned[i] === ')') depth--;

      if (depth === 0) {
        closeParenIdx = i;
        break;
      }
    }

    if (closeParenIdx === -1) {
      searchIdx = openParenIdx + 1;
      continue;
    }

    const bodyRaw = cleaned.slice(openParenIdx + 1, closeParenIdx);
    searchIdx = closeParenIdx + 1;

    const columns = [];
    const tableRelationships = [];
    const tablePks = new Set();

    // Split body into individual column/constraint definitions
    // Split on comma, but not commas inside parentheses
    const parts = splitOnTopLevelComma(bodyRaw);

    for (const part of parts) {
      const line = part.trim();
      if (!line) continue;

      const upper = line.toUpperCase();

      // ── Table-level PRIMARY KEY constraint ────────────────────────────────
      if (/^PRIMARY\s+KEY\s*\(/.test(upper)) {
        const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          pkMatch[1].split(',').forEach((col) => tablePks.add(col.trim().replace(/["`]/g, '')));
        }
        continue;
      }

      // ── FOREIGN KEY constraint ─────────────────────────────────────────────
      if (/^(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY/.test(upper)) {
        const fkMatch = line.match(
          /(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["']?(\w+)["']?\s*\(([^)]+)\)/i
        );
        if (fkMatch) {
          tableRelationships.push({
            sourceTable: tableName,
            sourceColumn: fkMatch[1].trim().replace(/["`]/g, ''),
            targetTable: fkMatch[2].trim(),
            targetColumn: fkMatch[3].trim().replace(/["`]/g, ''),
            type: 'MANY_TO_ONE',
          });
        }
        continue;
      }

      // ── UNIQUE constraint (table-level) ───────────────────────────────────
      if (/^(?:CONSTRAINT\s+\w+\s+)?UNIQUE\s*\(/.test(upper)) continue;
      // ── CHECK constraints ─────────────────────────────────────────────────
      if (/^(?:CONSTRAINT\s+\w+\s+)?CHECK\s*\(/.test(upper)) continue;
      // ── INDEX definitions ─────────────────────────────────────────────────
      if (/^(?:INDEX|KEY)\s+/.test(upper)) continue;

      // ── Column definition ─────────────────────────────────────────────────
      const colMatch = line.match(/^["'`]?(\w+)["'`]?\s+([^\s,]+(?:\s*\([^)]*\))?)(.*)?$/i);
      if (!colMatch) {
        warnings.push(`Skipped unrecognised line in table "${tableName}": ${line.slice(0, 60)}`);
        continue;
      }

      const colName = colMatch[1];
      const rawType = colMatch[2];
      const rest = (colMatch[3] || '').toUpperCase();

      const { type: dataType, warning: typeWarning } = normaliseDataType(rawType);
      if (typeWarning) warnings.push(`Table "${tableName}", column "${colName}": ${typeWarning}`);

      const isNotNull = /NOT\s+NULL/.test(rest);
      const isPk = /PRIMARY\s+KEY/.test(rest);
      const isUnique = /\bUNIQUE\b/.test(rest) && !isPk;

      let defaultValue = null;
      const defaultMatch = rest.match(/DEFAULT\s+'?([^',\s]+)'?/i);
      if (defaultMatch) {
        defaultValue = defaultMatch[1];
      }

      // Handle inline REFERENCES (column-level FK)
      const inlineFkMatch = line.match(/REFERENCES\s+["'`]?(\w+)["'`]?\s*\(([^)]+)\)/i);
      if (inlineFkMatch) {
        tableRelationships.push({
          sourceTable: tableName,
          sourceColumn: colName,
          targetTable: inlineFkMatch[1].trim(),
          targetColumn: inlineFkMatch[2].trim().replace(/["`]/g, ''),
          type: 'MANY_TO_ONE',
        });
      }

      columns.push({
        name: colName,
        dataType,
        nullable: isPk ? false : !isNotNull,
        primaryKey: isPk,
        unique: isUnique,
        defaultValue,
      });
    }

    // Apply table-level PKs
    for (const col of columns) {
      if (tablePks.has(col.name)) {
        col.primaryKey = true;
        col.nullable = false;
      }
    }

    tables.push({ name: tableName, description: null, columns });
    relationships.push(...tableRelationships);
  }

  return { tables, relationships, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a JSON schema file into a ParsedSchema structure.
 * Expected format: { tables: [{ name, columns: [{ name, type, ... }] }] }
 *
 * @param {string} text
 * @returns {{ tables: ParsedTable[], relationships: ParsedRelationship[], warnings: string[] }}
 */
export function parseJson(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    const err = new Error('Invalid JSON: file could not be parsed.');
    err.status = 400;
    throw err;
  }

  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tables)) {
    const err = new Error('Invalid JSON schema format. Expected: { "tables": [...] }');
    err.status = 400;
    throw err;
  }

  const tables = [];
  const relationships = [];
  const warnings = [];

  for (const [ti, tableRaw] of raw.tables.entries()) {
    if (!tableRaw.name || typeof tableRaw.name !== 'string') {
      warnings.push(`Table at index ${ti} is missing a "name" field — skipped.`);
      continue;
    }

    const columns = [];
    const colList = Array.isArray(tableRaw.columns) ? tableRaw.columns : [];

    for (const [ci, col] of colList.entries()) {
      if (!col.name) {
        warnings.push(`Column at index ${ci} in table "${tableRaw.name}" is missing "name" — skipped.`);
        continue;
      }
      const rawType = col.type || col.dataType || 'TEXT';
      const { type: dataType, warning: typeWarning } = normaliseDataType(rawType);
      if (typeWarning) warnings.push(`Table "${tableRaw.name}", column "${col.name}": ${typeWarning}`);

      columns.push({
        name: col.name,
        dataType,
        nullable: col.nullable !== false,
        primaryKey: col.primaryKey === true || col.primary_key === true,
        unique: col.unique === true,
        defaultValue: col.defaultValue ?? col.default ?? null,
      });
    }

    tables.push({
      name: tableRaw.name,
      description: tableRaw.description ?? null,
      columns,
    });

    // Parse inline relationships
    const relList = Array.isArray(tableRaw.relationships) ? tableRaw.relationships : [];
    for (const rel of relList) {
      if (!rel.sourceColumn || !rel.targetTable || !rel.targetColumn) {
        warnings.push(`Skipped incomplete relationship in table "${tableRaw.name}".`);
        continue;
      }
      relationships.push({
        sourceTable: tableRaw.name,
        sourceColumn: rel.sourceColumn,
        targetTable: rel.targetTable,
        targetColumn: rel.targetColumn,
        type: rel.type || rel.relationshipType || 'MANY_TO_ONE',
      });
    }
  }

  // Top-level relationships array
  if (Array.isArray(raw.relationships)) {
    for (const rel of raw.relationships) {
      if (!rel.sourceTable || !rel.sourceColumn || !rel.targetTable || !rel.targetColumn) {
        warnings.push('Skipped incomplete relationship in top-level relationships array.');
        continue;
      }
      relationships.push({
        sourceTable: rel.sourceTable,
        sourceColumn: rel.sourceColumn,
        targetTable: rel.targetTable,
        targetColumn: rel.targetColumn,
        type: rel.type || rel.relationshipType || 'MANY_TO_ONE',
      });
    }
  }

  return { tables, relationships, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV Parser
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_CSV_HEADERS = ['tableName', 'columnName', 'dataType'];
const ALL_CSV_HEADERS = [
  'tableName', 'columnName', 'dataType', 'nullable',
  'primaryKey', 'unique', 'defaultValue', 'referencedTable', 'referencedColumn',
];

/**
 * Parse a CSV schema file into a ParsedSchema structure.
 * Required columns: tableName, columnName, dataType
 * Optional: nullable, primaryKey, unique, defaultValue, referencedTable, referencedColumn
 *
 * @param {string} text
 * @returns {{ tables: ParsedTable[], relationships: ParsedRelationship[], warnings: string[] }}
 */
export function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());

  if (lines.length < 2) {
    const err = new Error('CSV file is empty or has no data rows.');
    err.status = 422;
    throw err;
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());

  // Validate required headers
  const missing = REQUIRED_CSV_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    const err = new Error(
      `CSV is missing required column headers: ${missing.join(', ')}. ` +
      `Required headers: ${REQUIRED_CSV_HEADERS.join(', ')}`
    );
    err.status = 422;
    throw err;
  }

  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));

  const tableMap = new Map();
  const relationships = [];
  const warnings = [];

  for (let rowNum = 1; rowNum < lines.length; rowNum++) {
    const values = parseCSVLine(lines[rowNum]);
    if (values.every((v) => !v.trim())) continue; // skip blank rows

    const get = (key) => (idx[key] !== undefined ? (values[idx[key]] || '').trim() : '');

    const tableName = get('tableName');
    const colName = get('columnName');
    const rawType = get('dataType');

    if (!tableName || !colName) {
      warnings.push(`Row ${rowNum + 1}: missing tableName or columnName — skipped.`);
      continue;
    }

    const { type: dataType, warning: typeWarning } = normaliseDataType(rawType || 'TEXT');
    if (typeWarning) warnings.push(`Row ${rowNum + 1}: ${typeWarning}`);

    const nullable = parseBool(get('nullable'), true);
    const primaryKey = parseBool(get('primaryKey'), false);
    const unique = parseBool(get('unique'), false);
    const defaultValue = get('defaultValue') || null;
    const referencedTable = get('referencedTable');
    const referencedColumn = get('referencedColumn');

    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, { name: tableName, description: null, columns: [] });
    }
    tableMap.get(tableName).columns.push({
      name: colName,
      dataType,
      nullable: primaryKey ? false : nullable,
      primaryKey,
      unique,
      defaultValue,
    });

    if (referencedTable && referencedColumn) {
      relationships.push({
        sourceTable: tableName,
        sourceColumn: colName,
        targetTable: referencedTable,
        targetColumn: referencedColumn,
        type: 'MANY_TO_ONE',
      });
    }
  }

  return { tables: Array.from(tableMap.values()), relationships, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema Validation
// ─────────────────────────────────────────────────────────────────────────────

const TABLE_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const COLUMN_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const VALID_REL_TYPES = new Set(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY']);

/**
 * Validate a ParsedSchema and return validation errors and warnings.
 * This does NOT write to the database.
 *
 * @param {{ tables, relationships, warnings }} parsed
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateSchema(parsed) {
  const errors = [];
  const warnings = [...parsed.warnings];
  const tableNames = new Set();

  if (!parsed.tables || parsed.tables.length === 0) {
    errors.push('No tables were found in the imported file.');
    return { errors, warnings };
  }

  for (const table of parsed.tables) {
    if (!TABLE_NAME_RE.test(table.name)) {
      errors.push(`Table name "${table.name}" is invalid. Must start with a letter or underscore and contain only alphanumeric characters.`);
    }

    if (table.name.length > 63) {
      errors.push(`Table name "${table.name}" exceeds 63 characters.`);
    }

    if (tableNames.has(table.name.toLowerCase())) {
      errors.push(`Duplicate table name: "${table.name}".`);
    }
    tableNames.add(table.name.toLowerCase());

    if (!table.columns || table.columns.length === 0) {
      errors.push(`Table "${table.name}" has no columns defined.`);
      continue;
    }

    const columnNames = new Set();
    let hasPk = false;

    for (const col of table.columns) {
      if (!COLUMN_NAME_RE.test(col.name)) {
        errors.push(`Column name "${col.name}" in table "${table.name}" is invalid.`);
      }
      if (col.name.length > 63) {
        errors.push(`Column "${col.name}" in table "${table.name}" exceeds 63 characters.`);
      }
      if (columnNames.has(col.name.toLowerCase())) {
        errors.push(`Duplicate column "${col.name}" in table "${table.name}".`);
      }
      columnNames.add(col.name.toLowerCase());

      if (col.primaryKey) hasPk = true;
    }

    if (!hasPk) {
      warnings.push(`Table "${table.name}" has no primary key defined.`);
    }
  }

  // Validate relationships
  for (const rel of parsed.relationships) {
    const srcExists = parsed.tables.some(
      (t) => t.name.toLowerCase() === rel.sourceTable.toLowerCase()
    );
    const tgtExists = parsed.tables.some(
      (t) => t.name.toLowerCase() === rel.targetTable.toLowerCase()
    );

    if (!srcExists) {
      errors.push(`Relationship references unknown source table "${rel.sourceTable}".`);
    }
    if (!tgtExists) {
      errors.push(`Relationship references unknown target table "${rel.targetTable}". ` +
        `If it is an existing table in the workspace it will be resolved at commit time.`);
    }

    if (rel.sourceTable === rel.targetTable && rel.sourceColumn === rel.targetColumn) {
      errors.push(`Self-referencing relationship on "${rel.sourceTable}.${rel.sourceColumn}" is not supported.`);
    }

    const relType = (rel.type || '').toUpperCase();
    if (relType && !VALID_REL_TYPES.has(relType)) {
      errors.push(`Invalid relationship type "${rel.type}". Valid: ${[...VALID_REL_TYPES].join(', ')}.`);
    }
  }

  return { errors, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the preview payload.
 * Checks which tables already exist in the workspace and marks them.
 * Does NOT write to the database.
 *
 * @param {string} workspaceId
 * @param {string} userId
 * @param {{ tables, relationships, warnings }} parsed
 * @returns {Promise<PreviewPayload>}
 */
export async function previewImport(workspaceId, userId, parsed) {
  await getWorkspace(workspaceId, userId);

  // Fetch existing table names in this workspace
  const existingTables = await prisma.table.findMany({
    where: { workspaceId },
    select: { name: true },
  });
  const existingNames = new Set(existingTables.map((t) => t.name.toLowerCase()));

  const tables = parsed.tables.map((t) => ({
    ...t,
    conflict: existingNames.has(t.name.toLowerCase()) ? 'EXISTS' : 'NONE',
  }));

  return {
    tables,
    relationships: parsed.relationships,
    warnings: parsed.warnings,
    errors: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Commit (Transaction)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_STRATEGIES = new Set(['SKIP', 'REPLACE', 'RENAME']);

/**
 * Commit the import inside a Prisma transaction.
 * On any failure, the full transaction is rolled back.
 *
 * @param {string} workspaceId
 * @param {string} userId
 * @param {{ tables, relationships }} payload  — same shape as preview response
 * @param {'SKIP'|'REPLACE'|'RENAME'} conflictStrategy
 * @returns {Promise<CommitResult>}
 */
export async function commitImport(workspaceId, userId, payload, conflictStrategy = 'SKIP') {
  await getWorkspace(workspaceId, userId);

  if (!VALID_STRATEGIES.has(conflictStrategy)) {
    const err = new Error(`Invalid conflictStrategy "${conflictStrategy}". Must be SKIP, REPLACE, or RENAME.`);
    err.status = 400;
    throw err;
  }

  const { tables, relationships } = payload;

  if (!Array.isArray(tables) || tables.length === 0) {
    const err = new Error('No tables in import payload.');
    err.status = 400;
    throw err;
  }

  // Build a name → id map for all tables (new + pre-existing) after the transaction
  const tableIdMap = new Map(); // finalName (lower) → db table id

  const created = { tables: 0, columns: 0, relationships: 0, skipped: 0, replaced: 0 };

  await prisma.$transaction(async (tx) => {
    // 1. Load existing tables once inside the transaction
    const existing = await tx.table.findMany({
      where: { workspaceId },
      include: { columns: true },
    });
    const existingByName = new Map(existing.map((t) => [t.name.toLowerCase(), t]));

    // Seed map with existing tables (pre-import)
    for (const t of existing) {
      tableIdMap.set(t.name.toLowerCase(), t.id);
    }

    // 2. Process each table
    for (const tableDef of tables) {
      const lowerName = tableDef.name.toLowerCase();
      const existingTable = existingByName.get(lowerName);

      if (existingTable) {
        if (conflictStrategy === 'SKIP') {
          created.skipped++;
          continue;
        }

        if (conflictStrategy === 'REPLACE') {
          // Delete existing table (cascade deletes columns + relationships)
          await tx.table.delete({ where: { id: existingTable.id } });
          existingByName.delete(lowerName);
          tableIdMap.delete(lowerName);
          created.replaced++;
          // Fall through to create fresh
        }

        if (conflictStrategy === 'RENAME') {
          // Append _import suffix; handle repeated suffix collisions
          let suffix = 1;
          let newName = `${tableDef.name}_import`;
          while (existingByName.has(newName.toLowerCase())) {
            newName = `${tableDef.name}_import${suffix++}`;
          }
          tableDef.name = newName;
        }
      }

      // Create the table
      const newTable = await tx.table.create({
        data: {
          workspaceId,
          name: tableDef.name,
          description: tableDef.description ?? null,
        },
      });
      created.tables++;
      tableIdMap.set(tableDef.name.toLowerCase(), newTable.id);

      // Create columns in batch
      const columnRecords = (tableDef.columns || []).map((col) => ({
        tableId: newTable.id,
        name: col.name,
        dataType: col.dataType,
        nullable: col.nullable ?? true,
        primaryKey: col.primaryKey ?? false,
        unique: col.unique ?? false,
        defaultValue: col.defaultValue ?? null,
      }));

      if (columnRecords.length > 0) {
        await tx.column.createMany({ data: columnRecords });
        created.columns += columnRecords.length;
      }
    }

    // 3. Create relationships — skip any with unresolvable tables
    if (Array.isArray(relationships) && relationships.length > 0) {
      for (const rel of relationships) {
        const srcTableId = tableIdMap.get(rel.sourceTable.toLowerCase());
        const tgtTableId = tableIdMap.get(rel.targetTable.toLowerCase());

        if (!srcTableId || !tgtTableId) continue; // silently skip unresolvable

        // Look up column IDs
        const srcCol = await tx.column.findFirst({
          where: { tableId: srcTableId, name: rel.sourceColumn },
          select: { id: true },
        });
        const tgtCol = await tx.column.findFirst({
          where: { tableId: tgtTableId, name: rel.targetColumn },
          select: { id: true },
        });

        if (!srcCol || !tgtCol) continue; // skip if columns don't exist

        const relType = VALID_REL_TYPES.has((rel.type || '').toUpperCase())
          ? rel.type.toUpperCase()
          : 'MANY_TO_ONE';

        await tx.relationship.create({
          data: {
            workspaceId,
            sourceTableId: srcTableId,
            sourceColumnId: srcCol.id,
            targetTableId: tgtTableId,
            targetColumnId: tgtCol.id,
            relationshipType: relType,
          },
        });
        created.relationships++;
      }
    }
  });

  return {
    summary: {
      tablesCreated: created.tables,
      columnsCreated: created.columns,
      relationshipsCreated: created.relationships,
      tablesSkipped: created.skipped,
      tablesReplaced: created.replaced,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Split CSV string on commas, respecting double-quoted fields. */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** Split on top-level commas (not inside parentheses). */
function splitOnTopLevelComma(str) {
  const parts = [];
  let depth = 0;
  let current = '';

  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function parseBool(val, defaultVal) {
  if (!val) return defaultVal;
  const lower = val.toLowerCase().trim();
  if (['true', 'yes', '1', 'y'].includes(lower)) return true;
  if (['false', 'no', '0', 'n'].includes(lower)) return false;
  return defaultVal;
}
