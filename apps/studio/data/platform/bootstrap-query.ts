import { useQuery } from '@tanstack/react-query'

import { fetchGet, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'

export type BootstrapState = {
  organizationsCount: number
  projectsCount: number
  latestProjectRef?: string
  target: string
}

export async function getBootstrapState() {
  const response = await fetchGet<BootstrapState>('/api/platform/bootstrap')
  if (response instanceof ResponseError) handleError(response)
  return response
}

export const useBootstrapStateQuery = <TData = BootstrapState>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<BootstrapState, ResponseError, TData> = {}) =>
  useQuery<BootstrapState, ResponseError, TData>({
    queryKey: ['platform-bootstrap'],
    queryFn: () => getBootstrapState(),
    enabled,
    staleTime: 0,
    ...options,
  })
