import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Reads the schema.prisma file and returns a sanitized JSON representation
 * containing table names, column names, and relationships.
 */
export function getSanitizedSchema() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Prisma schema file not found at: ' + schemaPath);
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  
  const datamodel = {};
  let currentModel = null;

  for (let line of lines) {
    line = line.trim();
    
    // Detect start of model
    if (line.startsWith('model ')) {
      const match = line.match(/^model\s+(\w+)\s*\{/);
      if (match) {
        currentModel = match[1];
        datamodel[currentModel] = {
          tableName: currentModel.toLowerCase(),
          columns: [],
          relationships: [],
        };
      }
      continue;
    }

    // Detect end of model
    if (line.startsWith('}')) {
      currentModel = null;
      continue;
    }

    // Parse fields within model block
    if (currentModel && line && !line.startsWith('//') && !line.startsWith('@@')) {
      const tokens = line.split(/\s+/);
      if (tokens.length >= 2) {
        const fieldName = tokens[0];
        const fieldType = tokens[1];

        const isArray = fieldType.endsWith('[]');
        const baseType = isArray ? fieldType.slice(0, -2) : fieldType.replace('?', '');

        // Match relationship fields (types referencing other models)
        const isModelType = ['User', 'Query', 'QueryVariant', 'AuditLog'].includes(baseType);

        if (isModelType) {
          datamodel[currentModel].relationships.push({
            field: fieldName,
            targetModel: baseType,
            type: isArray ? 'one-to-many' : 'many-to-one',
          });
        } else {
          datamodel[currentModel].columns.push({
            name: fieldName,
            dataType: baseType,
          });
        }
      }
    }
  }

  return datamodel;
}
