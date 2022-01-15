import React from 'react'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import { GoogleApiProvider } from '@/contexts/GoogleApi'

const App = ({ Component, pageProps }:AppProps) => {

  return (
    <GoogleApiProvider>
        <Head>
            <title>Insulina UI</title>
        </Head>
        <Component {...pageProps} />
    </GoogleApiProvider>
  )
}

export default App