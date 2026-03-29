import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchPost, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { useInvalidateProjectsInfiniteQuery } from './org-projects-infinite-query'

export type ProjectImportVariables = {
  name: string
  organizationSlug: string
  sourceUrl: string
  serviceRoleKey: string
  dbConnectionString: string
  managementApiToken: string
}

export async function importProject(body: ProjectImportVariables) {
  const response = await fetchPost('/api/platform/projects/import', body)
  if (response instanceof ResponseError) handleError(response)
  return response as {
    ref: string
    name: string
    organization_slug: string
    import_job_id?: string
  }
}

type ProjectImportData = Awaited<ReturnType<typeof importProject>>

export const useProjectImportMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ProjectImportData, ResponseError, ProjectImportVariables>,
  'mutationFn'
> = {}) => {
  const { invalidateProjectsQuery } = useInvalidateProjectsInfiniteQuery()

  return useMutation<ProjectImportData, ResponseError, ProjectImportVariables>({
    mutationFn: (vars) => importProject(vars),
    async onSuccess(data, variables, context) {
      await invalidateProjectsQuery()
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to import project: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
