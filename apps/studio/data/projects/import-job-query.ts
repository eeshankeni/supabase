import { useQuery } from '@tanstack/react-query'

import { fetchGet, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'

export type ImportJob = {
  id: string
  projectRef: string
  organizationSlug: string
  status: 'pending' | 'running' | 'failed' | 'completed'
  stage:
    | 'validating'
    | 'provisioning'
    | 'schema'
    | 'data'
    | 'config'
    | 'verifying'
    | 'completed'
    | 'failed'
  progress: number
  error?: string
  createdAt: string
  updatedAt: string
}

export async function getImportJob(id?: string) {
  if (!id) throw new Error('Import job id is required')
  const response = await fetchGet<ImportJob>(`/api/platform/import-jobs/${id}`)
  if (response instanceof ResponseError) handleError(response)
  return response
}

export const useImportJobQuery = <TData = ImportJob>(
  { id }: { id?: string },
  { enabled = true, ...options }: UseCustomQueryOptions<ImportJob, ResponseError, TData> = {}
) =>
  useQuery<ImportJob, ResponseError, TData>({
    queryKey: ['import-job', id],
    queryFn: () => getImportJob(id),
    enabled: enabled && typeof id !== 'undefined',
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'completed' || status === 'failed' ? false : 1500
    },
    ...options,
  })
