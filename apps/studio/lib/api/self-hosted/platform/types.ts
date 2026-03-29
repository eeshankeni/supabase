export type LocalPlan = {
  id: 'free'
  name: 'Free'
}

export type LocalOrganization = {
  id: number
  name: string
  slug: string
  billing_email: string
  organization_requires_mfa: boolean
  plan: LocalPlan
  inserted_at: string
}

export type LocalProjectSetupMode = 'blank' | 'import'

export type LocalProject = {
  id: number
  ref: string
  name: string
  status: 'COMING_UP' | 'ACTIVE_HEALTHY' | 'UNKNOWN'
  organization_id: number
  organization_slug: string
  cloud_provider: 'localhost'
  region: 'local'
  inserted_at: string
  subscription_id: string
  preview_branch_refs: string[]
  restUrl: string
  databaseName: string
  connectionString: string
  connectionStringEncrypted: string
  setupMode: LocalProjectSetupMode
  importJobId?: string
}

export type LocalImportJobStage =
  | 'validating'
  | 'provisioning'
  | 'schema'
  | 'data'
  | 'config'
  | 'verifying'
  | 'completed'
  | 'failed'

export type LocalImportJobStatus = 'pending' | 'running' | 'failed' | 'completed'

export type LocalEncryptedImportCredentials = {
  sourceUrl: string
  serviceRoleKey: string
  dbConnectionString: string
  managementApiToken: string
}

export type LocalImportJob = {
  id: string
  projectRef: string
  organizationSlug: string
  status: LocalImportJobStatus
  stage: LocalImportJobStage
  progress: number
  error?: string
  createdAt: string
  updatedAt: string
  startedAt: string
  encryptedCredentials: LocalEncryptedImportCredentials
}

export type LocalProfile = {
  id: number
  primary_email: string
  username: string
  first_name: string
  last_name: string
  disabled_features: string[]
}

export type LocalPlatformState = {
  version: 1
  profile: LocalProfile
  organizations: LocalOrganization[]
  projects: LocalProject[]
  importJobs: LocalImportJob[]
}
