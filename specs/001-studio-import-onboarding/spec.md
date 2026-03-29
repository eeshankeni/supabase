# Studio Import Onboarding

## Summary

This fork replaces the self-hosted `default` project bootstrap with a persistent onboarding flow that creates an organization first and then creates a project in one of two setup modes:

- `Blank project`
- `Import existing Supabase project`

Import mode collects:

- Source URL
- Service role key
- Database connection string
- Management API token

The fork must persist organizations, projects, and import jobs locally and expose them through a self-hosted `/platform/*` API surface that Studio can use without the hosted Supabase platform.

## Product Requirements

### First-run experience

- A fresh Studio instance must not redirect to `/project/default`.
- The first screen must route the user into organization creation.
- After creating an organization, the user must be routed into project creation for that organization.
- If the instance already has organizations but no projects, the user must be routed into project creation.
- If the instance already has at least one project, the user may be routed to the most recently created or selected project.

### Organization creation

- Self-hosted Studio must support creating organizations without the hosted billing flow.
- The first organization should default to a free/local plan representation.
- Organizations must be queryable from the same endpoints the existing Studio UI already uses.

### Project creation

- The existing project creation wizard remains the entry point.
- A new `Setup mode` field controls blank-vs-import behavior.
- Blank mode follows the existing project provisioning flow.
- Import mode requires all four import credentials before submission.
- Validation errors must be shown inline before submission.

### Import lifecycle

- Import mode creates a project record and an async import job.
- Import jobs must expose:
  - status
  - stage
  - progress
  - failure message when relevant
- Import must validate credentials before moving into the running state.
- Import jobs must be resumable by polling and must survive Studio restarts.

### Security

- Import credentials must never be stored in plaintext.
- The fork may persist encrypted secrets locally for resumable jobs.
- API responses must avoid returning the full stored secrets after creation.

## Technical Requirements

### Local platform store

- Persist a local profile, organizations, projects, and import jobs.
- Persist enough project metadata for the existing Studio routes to render.
- Support one backing Postgres database per project when possible by generating per-project connection strings.

### Self-hosted platform API compatibility

The fork must provide self-hosted handlers for:

- `GET/POST /platform/organizations`
- `GET /platform/organizations/{slug}`
- `GET /platform/organizations/{slug}/projects`
- `GET/POST /platform/projects`
- `GET /platform/projects/{ref}`
- `GET /platform/projects/{ref}/databases`
- `GET /platform/profile`
- `POST /platform/projects/import`
- `GET /platform/import-jobs/{id}`

### Import orchestration

- Import runs asynchronously and advances through deterministic stages.
- Stages:
  - `validating`
  - `provisioning`
  - `schema`
  - `data`
  - `config`
  - `verifying`
  - `completed`
- The initial implementation may target the self-hosted Studio stack as the destination environment.

## Validation Rules

### Setup mode

- `setupMode` is required.
- Supported values:
  - `blank`
  - `import`

### Import fields

- `sourceUrl` must be a valid `https://<project-ref>.supabase.co` URL.
- `serviceRoleKey` must be non-empty.
- `dbConnectionString` must be non-empty.
- `managementApiToken` must be non-empty.

## Success Criteria

- Fresh `http://localhost:8082` opens onboarding instead of `/project/default`.
- Creating an organization routes into project creation.
- Creating a blank project routes into the new project.
- Creating an import project routes into import progress and then into the new project.
- Import jobs persist across reloads.
- Wizard setup-mode validation is covered by focused tests.
