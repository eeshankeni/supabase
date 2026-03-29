import { randomUUID } from 'crypto'
import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'

import { PROJECT_REST_URL } from 'lib/constants/api'
import {
  POSTGRES_DATABASE,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER_READ_ONLY,
  POSTGRES_USER_READ_WRITE,
} from '../constants'
import { encryptString } from '../util'
import {
  LocalImportJob,
  LocalImportJobStage,
  LocalOrganization,
  LocalPlatformState,
  LocalProfile,
  LocalProject,
  LocalProjectSetupMode,
} from './types'

const STORE_PATH =
  process.env.STUDIO_LOCAL_PLATFORM_STORE_PATH ??
  path.join(os.homedir(), '.supabase-studio', 'local-platform-state.json')
const STORE_DIRECTORY = path.dirname(STORE_PATH)
const IMPORT_STAGE_DURATION_MS = 2_500

const DEFAULT_PROFILE: LocalProfile = {
  id: 1,
  primary_email: 'johndoe@supabase.io',
  username: 'johndoe',
  first_name: 'John',
  last_name: 'Doe',
  disabled_features: process.env.NEXT_PUBLIC_DISABLED_FEATURES?.split(',') ?? [],
}

function createInitialState(): LocalPlatformState {
  return {
    version: 1,
    profile: DEFAULT_PROFILE,
    organizations: [],
    projects: [],
    importJobs: [],
  }
}

async function ensureStoreFile() {
  await mkdir(STORE_DIRECTORY, { recursive: true })
  try {
    await readFile(STORE_PATH, 'utf8')
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(createInitialState(), null, 2), 'utf8')
  }
}

async function readState(): Promise<LocalPlatformState> {
  await ensureStoreFile()
  const content = await readFile(STORE_PATH, 'utf8')
  const parsed = JSON.parse(content) as LocalPlatformState
  return tickImportJobs(parsed)
}

async function writeState(state: LocalPlatformState) {
  await ensureStoreFile()
  const tempPath = `${STORE_PATH}.tmp`
  await writeFile(tempPath, JSON.stringify(state, null, 2), 'utf8')
  await rename(tempPath, STORE_PATH)
}

export async function updateState(
  updater: (state: LocalPlatformState) => LocalPlatformState | Promise<LocalPlatformState>
) {
  const current = await readState()
  const next = await updater(current)
  await writeState(next)
  return next
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.length > 0 ? slug : 'organization'
}

function makeUniqueSlug(existing: string[], base: string) {
  const normalized = slugify(base)
  let slug = normalized
  let index = 2
  while (existing.includes(slug)) {
    slug = `${normalized}-${index}`
    index += 1
  }
  return slug
}

function makeProjectRef(existing: string[], name: string) {
  const base = slugify(name).replace(/-/g, '').slice(0, 12) || 'project'
  let suffix = Math.random().toString(36).slice(2, 8)
  let ref = `${base}${suffix}`.slice(0, 20)
  while (existing.includes(ref)) {
    suffix = Math.random().toString(36).slice(2, 8)
    ref = `${base}${suffix}`.slice(0, 20)
  }
  return ref
}

function buildConnectionString({ databaseName, readOnly }: { databaseName: string; readOnly?: boolean }) {
  const user = readOnly ? POSTGRES_USER_READ_ONLY : POSTGRES_USER_READ_WRITE
  return `postgresql://${user}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${databaseName}`
}

function nowIso() {
  return new Date().toISOString()
}

function tickImportJobs(state: LocalPlatformState) {
  let didChange = false

  const nextJobs = state.importJobs.map((job) => {
    if (job.status === 'completed' || job.status === 'failed') return job

    const elapsed = Date.now() - new Date(job.startedAt).getTime()
    const stageIndex = Math.min(Math.floor(elapsed / IMPORT_STAGE_DURATION_MS), 6)
    const stageOrder: LocalImportJobStage[] = [
      'validating',
      'provisioning',
      'schema',
      'data',
      'config',
      'verifying',
      'completed',
    ]
    const nextStage = stageOrder[stageIndex]
    const nextStatus = nextStage === 'completed' ? 'completed' : 'running'
    const nextProgress = nextStage === 'completed' ? 100 : Math.min(95, 15 + stageIndex * 15)

    if (
      nextStage !== job.stage ||
      nextStatus !== job.status ||
      nextProgress !== job.progress
    ) {
      didChange = true
      return {
        ...job,
        stage: nextStage,
        status: nextStatus,
        progress: nextProgress,
        updatedAt: nowIso(),
      }
    }

    return job
  })

  const nextProjects = state.projects.map((project) => {
    if (!project.importJobId) return project
    const job = nextJobs.find((item) => item.id === project.importJobId)
    if (!job) return project

    const nextStatus = job.status === 'completed' ? 'ACTIVE_HEALTHY' : 'COMING_UP'
    if (project.status !== nextStatus) {
      didChange = true
      return { ...project, status: nextStatus }
    }
    return project
  })

  return didChange ? { ...state, importJobs: nextJobs, projects: nextProjects } : state
}

function toOrganizationResponse(organization: LocalOrganization) {
  return organization
}

function toProjectDatabase(project: LocalProject) {
  return {
    cloud_provider: project.cloud_provider as any,
    connectionString: project.connectionStringEncrypted,
    connection_string_read_only: encryptString(
      buildConnectionString({ databaseName: project.databaseName, readOnly: true })
    ),
    db_host: POSTGRES_HOST,
    db_name: project.databaseName,
    db_port: POSTGRES_PORT,
    db_user: POSTGRES_USER_READ_WRITE,
    identifier: project.ref,
    infra_compute_size: 'micro',
    inserted_at: project.inserted_at,
    region: project.region,
    restUrl: project.restUrl,
    size: 'micro',
    status: project.status,
  }
}

function toProjectSummary(project: LocalProject) {
  return {
    id: project.id,
    ref: project.ref,
    name: project.name,
    status: project.status,
    organization_id: project.organization_id,
    organization_slug: project.organization_slug,
    cloud_provider: project.cloud_provider,
    region: project.region,
    inserted_at: project.inserted_at,
    subscription_id: project.subscription_id,
    preview_branch_refs: project.preview_branch_refs,
    databases: [toProjectDatabase(project)],
  }
}

function toProjectDetail(project: LocalProject) {
  return {
    ...toProjectSummary(project),
    connectionString: project.connectionStringEncrypted,
    restUrl: project.restUrl,
    postgrestStatus: 'ONLINE',
  }
}

function toProfileResponse(state: LocalPlatformState) {
  return {
    ...state.profile,
    organizations: state.organizations.map((organization) => ({
      ...organization,
      projects: state.projects
        .filter((project) => project.organization_id === organization.id)
        .map((project) => ({
          ...toProjectSummary(project),
          connectionString: project.connectionStringEncrypted,
        })),
    })),
  }
}

export async function listOrganizations() {
  const state = await readState()
  return state.organizations.map(toOrganizationResponse)
}

export async function getOrganization(slug: string) {
  const state = await readState()
  return state.organizations.find((organization) => organization.slug === slug)
}

export async function createOrganization({
  name,
}: {
  name: string
}) {
  const state = await updateState((current) => {
    const slug = makeUniqueSlug(
      current.organizations.map((organization) => organization.slug),
      name
    )
    const organization: LocalOrganization = {
      id: current.organizations.length + 1,
      name,
      slug,
      billing_email: current.profile.primary_email,
      organization_requires_mfa: false,
      plan: { id: 'free', name: 'Free' },
      inserted_at: nowIso(),
    }

    return {
      ...current,
      organizations: [...current.organizations, organization],
    }
  })

  return state.organizations[state.organizations.length - 1]
}

export async function listProjects() {
  const state = await readState()
  return state.projects.map(toProjectSummary)
}

export async function listProjectsPage() {
  const projects = await listProjects()
  return {
    projects,
    pagination: {
      count: projects.length,
    },
  }
}

export async function listOrganizationProjects(slug: string) {
  const state = await readState()
  const projects = state.projects
    .filter((project) => project.organization_slug === slug)
    .map(toProjectSummary)

  return {
    projects,
    pagination: {
      count: projects.length,
    },
  }
}

export async function getProject(ref: string) {
  const state = await readState()
  const project = state.projects.find((item) => item.ref === ref)
  return project ? toProjectDetail(project) : undefined
}

export async function getProjectDatabases(ref: string) {
  const state = await readState()
  const project = state.projects.find((item) => item.ref === ref)
  return project ? [toProjectDatabase(project)] : []
}

export async function createProject({
  name,
  organizationSlug,
  setupMode,
  importCredentials,
}: {
  name: string
  organizationSlug: string
  setupMode: LocalProjectSetupMode
  importCredentials?: {
    sourceUrl: string
    serviceRoleKey: string
    dbConnectionString: string
    managementApiToken: string
  }
}) {
  const state = await updateState((current) => {
    const organization = current.organizations.find((item) => item.slug === organizationSlug)
    if (!organization) {
      throw new Error(`Organization "${organizationSlug}" not found`)
    }

    const ref = makeProjectRef(
      current.projects.map((project) => project.ref),
      name
    )
    const databaseName = POSTGRES_DATABASE
    const connectionString = buildConnectionString({ databaseName })
    const insertedAt = nowIso()

    const importJob =
      setupMode === 'import' && importCredentials
        ? ({
            id: randomUUID(),
            projectRef: ref,
            organizationSlug,
            status: 'pending',
            stage: 'validating',
            progress: 5,
            createdAt: insertedAt,
            updatedAt: insertedAt,
            startedAt: insertedAt,
            encryptedCredentials: {
              sourceUrl: encryptString(importCredentials.sourceUrl),
              serviceRoleKey: encryptString(importCredentials.serviceRoleKey),
              dbConnectionString: encryptString(importCredentials.dbConnectionString),
              managementApiToken: encryptString(importCredentials.managementApiToken),
            },
          } satisfies LocalImportJob)
        : undefined

    const project: LocalProject = {
      id: current.projects.length + 1,
      ref,
      name,
      status: setupMode === 'import' ? 'COMING_UP' : 'ACTIVE_HEALTHY',
      organization_id: organization.id,
      organization_slug: organization.slug,
      cloud_provider: 'localhost',
      region: 'local',
      inserted_at: insertedAt,
      subscription_id: '',
      preview_branch_refs: [],
      restUrl: PROJECT_REST_URL,
      databaseName,
      connectionString,
      connectionStringEncrypted: encryptString(connectionString),
      setupMode,
      importJobId: importJob?.id,
    }

    return {
      ...current,
      projects: [...current.projects, project],
      importJobs: importJob ? [...current.importJobs, importJob] : current.importJobs,
    }
  })

  const project = state.projects[state.projects.length - 1]
  const organization = state.organizations.find((item) => item.id === project.organization_id)

  return {
    ...toProjectDetail(project),
    organization_slug: organization?.slug ?? organizationSlug,
    import_job_id: project.importJobId,
  }
}

export async function getImportJob(id: string) {
  const state = await updateState((current) => tickImportJobs(current))
  const job = state.importJobs.find((item) => item.id === id)
  if (!job) return undefined

  return {
    id: job.id,
    projectRef: job.projectRef,
    organizationSlug: job.organizationSlug,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  }
}

export async function getBootstrapState() {
  const state = await readState()
  const latestProject = [...state.projects].sort((a, b) => b.inserted_at.localeCompare(a.inserted_at))[0]

  return {
    profile: toProfileResponse(state),
    organizations: state.organizations.map(toOrganizationResponse),
    projects: state.projects.map(toProjectSummary),
    latestProjectRef: latestProject?.ref,
  }
}

export async function getProfile() {
  const state = await readState()
  return toProfileResponse(state)
}
