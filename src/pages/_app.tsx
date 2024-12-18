import { useEffect } from 'react';
import type { AppProps } from 'next/app'
import {
  CalcResultProvider,
  CalcTablesProvider,
  SettingsProvider,
  SideBarProvider,
  LoadingProvider
} from '@/contexts'
import Head from 'next/head'

import '../styles/reset.css';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import themeOptions from '@/styles/theme'
import {
  AppBar,
  SideBar
} from '@/components';
import { GoogleOAuthProvider } from '@react-oauth/google'
import AuthProvider from '@/contexts/AuthProvider';

import { ApolloProvider } from '@apollo/client'
import { useApollo } from '@/api/apolloClient';

const clientId = process.env.NEXT_PUBLIC_OAUTH_ID
const theme = createTheme(themeOptions);

function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

const OAuthProps = {
  clientId,
  onScriptLoadSuccess () {
    console.info("OAuth - script loaded!")
  },
  onScriptLoadError() {
    console.error("OAuth - script load error.")
  }
}

const App = ({ Component, pageProps } : AppProps) => {
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  const apolloClient = useApollo(pageProps.initialApolloState)

  console.log(`OAuthProps =>`, OAuthProps)

  return (
    <SafeHydrate>
      <GoogleOAuthProvider {...OAuthProps} >
        <AuthProvider>
          <ApolloProvider client={apolloClient}>
            <LoadingProvider>
            <CalcTablesProvider>
              <SettingsProvider>
                <CalcResultProvider>
                  <SideBarProvider>
                    <ThemeProvider theme={theme}>
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

                          <link rel="manifest" href="./manifest.webmanifest"></link>
                        
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
                    </ThemeProvider>
                  </SideBarProvider>
                </CalcResultProvider>
              </SettingsProvider>
            </CalcTablesProvider>
            </LoadingProvider>
          </ApolloProvider>
        </AuthProvider>        
      </GoogleOAuthProvider>
    </SafeHydrate>

  )
}

export default App