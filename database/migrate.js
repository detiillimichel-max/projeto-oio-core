import { createClient } from '@libsql/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url || !authToken) {
  throw new Error('TURSO_DATABASE_URL e TURSO_AUTH_TOKEN são obrigatórios.');
}

const db = createClient({ url, authToken });

function hasSqlStatement(statement) {
  return statement
    .replace(/^\s*--[^\r\n]*(?:\r?\n|$)/gm, '')
    .trim()
    .length > 0;
}

function splitSql(sql) {
  const statements = [];
  let current = '';
  let quote = null;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (quote) {
      current += char;
      if (char === quote) {
        if (next === quote) {
          current += next;
          i += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      current += char;
      continue;
    }

    if (char === ';') {
      const statement = current.trim();
      if (statement && hasSqlStatement(statement)) {
        statements.push(statement);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const finalStatement = current.trim();
  if (finalStatement && hasSqlStatement(finalStatement)) {
    statements.push(finalStatement);
  }

  return statements;
}

await db.execute(`
  CREATE TABLE IF NOT EXISTS _oio_migrations (
    id TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
  )
`);

const result = await fs.readdir(migrationsDir, { withFileTypes: true });
const files = result
  .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
  .map((entry) => entry.name)
  .sort();

if (files.length === 0) {
  console.log('Nenhuma migration encontrada.');
  process.exit(0);
}

const appliedResult = await db.execute('SELECT id FROM _oio_migrations');
const applied = new Set(appliedResult.rows.map((row) => String(row.id)));

for (const file of files) {
  if (applied.has(file)) {
    console.log(`SKIP ${file} (já aplicada)`);
    continue;
  }

  const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
  const statements = splitSql(sql);

  console.log(`APPLY ${file}`);

  for (const statement of statements) {
    await db.execute(statement);
  }

  await db.execute(
    'INSERT INTO _oio_migrations (id, applied_at) VALUES (?, ?)',
    [file, Date.now()]
  );

  console.log(`DONE ${file}`);
}

console.log('Migrations concluídas.');
