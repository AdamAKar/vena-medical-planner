// pages/index.js
// Serves the Vena Medical planner app
// All API calls (Zoho, Supabase) handled by /pages/api/

import Head from 'next/head'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Redirect to the app HTML
    window.location.href = '/app.html'
  }, [])

  return (
    <Head>
      <title>Vena Medical — Field Sales Planner</title>
      <meta name="description" content="Vena Medical MicroAngioscope Field Sales Planner" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/app.html',
      permanent: false,
    },
  }
}
