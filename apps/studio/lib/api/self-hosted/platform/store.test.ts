import { mkdtemp, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tempDirectory: string

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-29T12:00:00.000Z'))
  tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'studio-platform-store-'))
  vi.stubEnv(
    'STUDIO_LOCAL_PLATFORM_STORE_PATH',
    path.join(tempDirectory, 'local-platform-state.json')
  )
})

afterEach(async () => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  await rm(tempDirectory, { recursive: true, force: true })
})

describe('local platform store', () => {
  it('computes bootstrap targets as orgs and projects are created', async () => {
    const store = await import('./store')

    expect((await store.getBootstrapState()).latestProjectRef).toBeUndefined()

    const initialBootstrap = await store.getBootstrapState()
    expect(initialBootstrap.organizations).toHaveLength(0)

    const organization = await store.createOrganization({ name: 'My Org' })
    const bootstrapAfterOrg = await store.getBootstrapState()
    expect(bootstrapAfterOrg.organizations).toHaveLength(1)
    expect(bootstrapAfterOrg.projects).toHaveLength(0)

    const project = await store.createProject({
      name: 'My Project',
      organizationSlug: organization.slug,
      setupMode: 'blank',
    })

    const bootstrapAfterProject = await store.getBootstrapState()
    expect(bootstrapAfterProject.latestProjectRef).toBe(project.ref)
    expect(bootstrapAfterProject.projects).toHaveLength(1)
  })

  it('advances import jobs to completion over time', async () => {
    const store = await import('./store')
    const organization = await store.createOrganization({ name: 'Import Org' })
    const project = await store.createProject({
      name: 'Imported Project',
      organizationSlug: organization.slug,
      setupMode: 'import',
      importCredentials: {
        sourceUrl: 'https://abcd1234.supabase.co',
        serviceRoleKey: 'service-role',
        dbConnectionString: 'postgresql://user:pass@host:5432/postgres',
        managementApiToken: 'sbp_token',
      },
    })

    expect(project.import_job_id).toBeDefined()

    const initialJob = await store.getImportJob(project.import_job_id)
    expect(initialJob?.status).toBe('running')
    expect(initialJob?.stage).toBe('validating')

    await vi.advanceTimersByTimeAsync(18_000)

    const completedJob = await store.getImportJob(project.import_job_id)
    expect(completedJob?.status).toBe('completed')
    expect(completedJob?.progress).toBe(100)

    const completedProject = await store.getProject(project.ref)
    expect(completedProject?.status).toBe('ACTIVE_HEALTHY')
  })
})
