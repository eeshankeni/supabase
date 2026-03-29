import { describe, expect, it } from 'vitest'

import { FormSchema } from './ProjectCreation.schema'

const baseValues = {
  organization: 'my-org',
  projectName: 'My Project',
  highAvailability: false,
  postgresVersion: '',
  dbRegion: 'East US',
  cloudProvider: 'AWS',
  dbPass: 'super-secure-password',
  dbPassStrength: 4 as const,
  dbPassStrengthMessage: '',
  dbPassStrengthWarning: '',
  instanceSize: 'micro',
  dataApi: true,
  enableRlsEventTrigger: false,
  postgresVersionSelection: '',
  useOrioleDb: false,
  setupMode: 'blank' as const,
  sourceUrl: '',
  serviceRoleKey: '',
  importDbConnectionString: '',
  managementApiToken: '',
}

describe('ProjectCreation FormSchema', () => {
  it('accepts a blank-project payload without import credentials', () => {
    const result = FormSchema.safeParse(baseValues)
    expect(result.success).toBe(true)
  })

  it('requires import credentials in import mode', () => {
    const result = FormSchema.safeParse({
      ...baseValues,
      setupMode: 'import' as const,
    })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('Expected schema validation to fail')

    const paths = result.error.issues.map((issue) => issue.path.join('.'))
    expect(paths).toContain('sourceUrl')
    expect(paths).toContain('serviceRoleKey')
    expect(paths).toContain('importDbConnectionString')
    expect(paths).toContain('managementApiToken')
  })

  it('accepts a valid import payload', () => {
    const result = FormSchema.safeParse({
      ...baseValues,
      setupMode: 'import' as const,
      sourceUrl: 'https://abcd1234.supabase.co',
      serviceRoleKey: 'service-role',
      importDbConnectionString: 'postgresql://user:pass@host:5432/postgres',
      managementApiToken: 'sbp_token',
    })

    expect(result.success).toBe(true)
  })
})
