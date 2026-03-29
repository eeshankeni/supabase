import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { getImportJob } from 'lib/api/self-hosted/platform/store'

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
  const id = typeof req.query.id === 'string' ? req.query.id : ''
  const job = await getImportJob(id)

  if (!job) {
    return res.status(404).json({ error: { message: 'Import job not found' } })
  }

  return res.status(200).json(job)
}
