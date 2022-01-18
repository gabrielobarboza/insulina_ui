import { useEffect } from 'react';
import type { AppProps } from 'next/app'
import {
  CalcTablesProvider,
  ConfigTokenProvider,
  SideBarProvider
} from '@/contexts'
import Head from 'next/head'
import '../styles/reset.css';

import { MuiThemeProvider, createTheme } from '@material-ui/core/styles';
import themeUi from '@/styles/theme'
import {
  AppBar,
  SideBar
} from '@/components';

import {
  serviceWorker
} from '@/utils';


const theme = createTheme(themeUi);

function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

const App = ({ Component, pageProps } : AppProps) => {
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
    // Register serviceWorker
    // serviceWorker()
  }, []);

  return (
    <SafeHydrate>
      <CalcTablesProvider>
        <ConfigTokenProvider>
          <SideBarProvider>
            <MuiThemeProvider theme={theme}>
              <Head>
                  <meta charSet="utf-8" />
                  <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

                  <meta name='application-name' content='Insulina UI' />
                  <meta name='apple-mobile-web-app-capable' content='yes' />
                  <meta name='apple-mobile-web-app-status-bar-style' content='default' />
                  <meta name='apple-mobile-web-app-title' content='Insulina UI' />
                  <meta name='description' content='Gerencie tabelas de cálculo para administrar Insulina' />
                  <meta name='format-detection' content='telephone=no' />
                  <meta name='mobile-web-app-capable' content='yes' />
                  <meta name='msapplication-config' content='none' />
                  <meta name='msapplication-TileColor' content='#82368C' />
                  <meta name='msapplication-tap-highlight' content='no' />

                  <link rel="manifest" href="./manifest.json"></link>
                 
                  <link rel="shortcut icon" href="./icons/icon-insulina-ui.svg" />
                  <link
                    href="./icons/icon-insulina-ui.svg"
                    rel="icon"
                    type="image/svg+xml"
                    sizes="16x16"
                  />
                  <link
                    href="./icons/icon-insulina-ui.svg"
                    rel="icon"
                    type="image/svg+xml"
                    sizes="32x32"
                  />
                  <link rel="apple-touch-icon" href="./icons/icon-insulina-ui.svg"></link>
                  <meta name="theme-color" content="#82368C" />

                  <meta http-equiv="ScreenOrientation" content="autoRotate:disabled" />
                  <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover' />
                  <title>Insulina UI</title>

                  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
                  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
              </Head>
              <AppBar />
              <SideBar />
              <Component {...pageProps} />
            </MuiThemeProvider>
          </SideBarProvider>
        </ConfigTokenProvider>
      </CalcTablesProvider>
    </SafeHydrate>

  )
}

export default App