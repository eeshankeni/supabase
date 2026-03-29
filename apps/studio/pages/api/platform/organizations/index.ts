import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import {
  createOrganization,
  listOrganizations,
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
  const response = await listOrganizations()
  return res.status(200).json(response)
}

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (name.length === 0) {
    return res.status(400).json({ error: { message: 'Organization name is required' } })
  }

  const organization = await createOrganization({ name })
  return res.status(200).json(organization)
}
