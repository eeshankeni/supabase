import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import Panel from 'components/ui/Panel'
import { useImportJobQuery } from 'data/projects/import-job-query'
import type { NextPageWithLayout } from 'types'

const ProjectImportPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, importJobId } = useParams()
  const jobId = typeof router.query.jobId === 'string' ? router.query.jobId : importJobId
  const { data: job } = useImportJobQuery({ id: jobId }, { enabled: typeof jobId === 'string' })

  useEffect(() => {
    if (job?.status === 'completed' && ref) {
      router.replace(`/project/${ref}`)
    }
  }, [job?.status, ref, router])

  return (
    <>
      <Head>
        <title>Import project</title>
      </Head>
      <Panel
        title={
          <div>
            <h3>Importing project</h3>
            <p className="text-sm text-foreground-light">
              Studio is provisioning the destination project and replaying the import stages.
            </p>
          </div>
        }
      >
        <Panel.Content>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium">Current stage</div>
              <div className="text-sm text-foreground-light capitalize">
                {job?.stage ?? 'Preparing import'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Progress</div>
              <div className="text-sm text-foreground-light">{job?.progress ?? 0}%</div>
            </div>
            {job?.error ? (
              <div className="text-sm text-destructive">Import failed: {job.error}</div>
            ) : null}
          </div>
        </Panel.Content>
      </Panel>
    </>
  )
}

ProjectImportPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default ProjectImportPage
