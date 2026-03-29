import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { getBootstrapState } from 'lib/api/self-hosted/platform/store'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const state = await getBootstrapState()

  const target =
    state.organizations.length === 0
      ? '/new'
      : state.projects.length === 0
        ? `/new/${state.organizations[0].slug}`
        : state.latestProjectRef
          ? `/project/${state.latestProjectRef}`
          : '/organizations'

  return res.status(200).json({
    organizationsCount: state.organizations.length,
    projectsCount: state.projects.length,
    latestProjectRef: state.latestProjectRef,
    target,
  })
}
