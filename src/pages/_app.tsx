import type { AppProps } from 'next/app'
import {ConfigProvider, CalcTablesProvider } from '@/contexts'
import Head from 'next/head'

const App = ({ Component, pageProps }:AppProps) => {

  return (
    <CalcTablesProvider>
      <ConfigProvider>
        <Head>
            <title>Insulina UI</title>
            <link rel="shortcut icon" href="./assets/icon-insulina-ui.png" />
        </Head>
        <Component {...pageProps} />
      </ConfigProvider>
    </CalcTablesProvider>
  )
}

export default App