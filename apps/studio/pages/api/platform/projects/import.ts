import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { createProject } from 'lib/api/self-hosted/platform/store'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const organizationSlug = typeof req.body?.organizationSlug === 'string' ? req.body.organizationSlug : ''
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const sourceUrl = typeof req.body?.sourceUrl === 'string' ? req.body.sourceUrl.trim() : ''
  const serviceRoleKey =
    typeof req.body?.serviceRoleKey === 'string' ? req.body.serviceRoleKey.trim() : ''
  const dbConnectionString =
    typeof req.body?.dbConnectionString === 'string' ? req.body.dbConnectionString.trim() : ''
  const managementApiToken =
    typeof req.body?.managementApiToken === 'string' ? req.body.managementApiToken.trim() : ''

  if (!organizationSlug || !name || !sourceUrl || !serviceRoleKey || !dbConnectionString || !managementApiToken) {
    return res.status(400).json({ error: { message: 'All import fields are required' } })
  }

  try {
    const parsed = new URL(sourceUrl)
    if (!parsed.hostname.endsWith('.supabase.co')) {
      return res.status(400).json({ error: { message: 'Source URL must be a Supabase project URL' } })
    }
  } catch {
    return res.status(400).json({ error: { message: 'Source URL must be a valid URL' } })
  }

  const project = await createProject({
    name,
    organizationSlug,
    setupMode: 'import',
    importCredentials: {
      sourceUrl,
      serviceRoleKey,
      dbConnectionString,
      managementApiToken,
    },
  })

  return res.status(200).json(project)
}
