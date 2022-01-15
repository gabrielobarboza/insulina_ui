import React from 'react'
import Head from 'next/head'
import Script from 'next/script'
import type { AppProps } from 'next/app'

const App = ({ Component, pageProps }:AppProps) => {

  return (
    <>
        <Head>
            <title>Insulina UI</title>
        </Head>
        <Script src="https://apis.google.com/js/client.js" />
        <Component {...pageProps} />
    </>
  )
}

export default App