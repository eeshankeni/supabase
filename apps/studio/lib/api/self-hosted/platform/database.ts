import { executeQuery } from '../query'

function quoteIdentifier(identifier: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid database identifier: ${identifier}`)
  }

  return `"${identifier.replace(/"/g, '""')}"`
}

export async function ensureProjectDatabase(databaseName: string) {
  const exists = await executeQuery<{ datname: string }>({
    query: 'select datname from pg_database where datname = $1',
    parameters: [databaseName],
  })

  if (exists.error) throw exists.error
  if ((exists.data ?? []).length > 0) return

  const createResult = await executeQuery({
    query: `create database ${quoteIdentifier(databaseName)}`,
  })

  if (createResult.error) throw createResult.error
}
