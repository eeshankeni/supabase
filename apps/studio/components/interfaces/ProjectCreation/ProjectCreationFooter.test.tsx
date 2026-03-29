import { screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { customRender } from 'tests/lib/custom-render'
import { ProjectCreationFooter } from './ProjectCreationFooter'
import type { CreateProjectForm } from './ProjectCreation.schema'

vi.mock('common', async () => {
  const actual = await vi.importActual<object>('common')
  return {
    ...actual,
    useFlag: () => false,
    LOCAL_STORAGE_KEYS: {
      LAST_VISITED_ORGANIZATION: 'last-visited-organization',
    },
  }
})

vi.mock('hooks/misc/useLocalStorage', () => ({
  useLocalStorageQuery: () => ['my-org'],
}))

vi.mock('hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({
    data: {
      plan: { id: 'free' },
      slug: 'my-org',
    },
  }),
}))

function FooterHarness({ setupMode }: { setupMode: CreateProjectForm['setupMode'] }) {
  const form = useForm<CreateProjectForm>({
    defaultValues: {
      organization: 'my-org',
      projectName: 'My Project',
      highAvailability: false,
      postgresVersion: '',
      dbRegion: 'East US',
      cloudProvider: 'AWS',
      dbPass: 'super-secure-password',
      dbPassStrength: 4,
      dbPassStrengthMessage: '',
      dbPassStrengthWarning: '',
      instanceSize: 'micro',
      dataApi: true,
      enableRlsEventTrigger: false,
      postgresVersionSelection: '',
      useOrioleDb: false,
      setupMode,
      sourceUrl: '',
      serviceRoleKey: '',
      importDbConnectionString: '',
      managementApiToken: '',
    },
  })

  return (
    <ProjectCreationFooter
      form={form}
      canCreateProject
      instanceSize="micro"
      organizationProjects={[]}
      isCreatingNewProject={false}
      isSuccessNewProject={false}
    />
  )
}

describe('ProjectCreationFooter', () => {
  it('shows the default blank-project CTA', () => {
    customRender(<FooterHarness setupMode="blank" />)
    expect(screen.getByRole('button', { name: 'Create new project' })).toBeInTheDocument()
  })

  it('shows the import CTA for import mode', () => {
    customRender(<FooterHarness setupMode="import" />)
    expect(screen.getByRole('button', { name: 'Start project import' })).toBeInTheDocument()
  })
})
