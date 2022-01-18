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
  }, []);

  return (
    <SafeHydrate>
      <CalcTablesProvider>
        <ConfigTokenProvider>
          <SideBarProvider>
            <MuiThemeProvider theme={theme}>
              <Head>
                  <title>Insulina UI</title>
                  <meta http-equiv="ScreenOrientation" content="autoRotate:disabled" />
                  <link rel="shortcut icon" href="./icons/icon-insulina-ui.svg" />
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