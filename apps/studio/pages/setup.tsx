import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { getBootstrapState } from 'lib/api/self-hosted/platform/store'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'
import type { NextPageWithLayout } from 'types'

const SetupPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Studio setup</title>
      </Head>
      <PageLayout title="Preparing Studio">
        <p className="text-sm text-foreground-light">
          Loading your organizations and projects so Studio can send you to the right setup step.
        </p>
      </PageLayout>
    </>
  )
}

SetupPage.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>

export const getServerSideProps: GetServerSideProps = async () => {
  const state = await getBootstrapState()

  const destination =
    state.organizations.length === 0
      ? '/new'
      : state.projects.length === 0
        ? `/new/${state.organizations[0].slug}`
        : state.latestProjectRef
          ? `/project/${state.latestProjectRef}`
          : '/organizations'

  return {
    redirect: {
      destination,
      permanent: false,
    },
  }
}

export default SetupPage
