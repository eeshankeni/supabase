import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import {
  createProject,
  listProjectsPage,
} from 'lib/api/self-hosted/platform/store'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handleCreate(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const response = await listProjectsPage()
  return res.status(200).json(response)
}

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  const organizationSlug = req.body?.organization_slug
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''

  if (typeof organizationSlug !== 'string' || organizationSlug.length === 0) {
    return res.status(400).json({ error: { message: 'organization_slug is required' } })
  }

  if (name.length === 0) {
    return res.status(400).json({ error: { message: 'Project name is required' } })
  }

  const project = await createProject({
    name,
    organizationSlug,
    setupMode: 'blank',
  })

  return res.status(200).json(project)
}
