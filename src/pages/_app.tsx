import type { AppProps } from 'next/app'
import { CalcTablesProvider } from '@/contexts/CalcTables'
import Head from 'next/head'

const App = ({ Component, pageProps }:AppProps) => {

  return (
    <CalcTablesProvider>
        <Head>
            <title>Insulina UI</title>
            <link rel="shortcut icon" href="./assets/icon-p.png" />
        </Head>
        <Component {...pageProps} />
    </CalcTablesProvider>
  )
}

export default App