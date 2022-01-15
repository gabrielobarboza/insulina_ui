import { createContext, useState, useContext } from 'react'
import { enviroment as env }  from '@/utils'
import Script from 'next/script'

const gapi_src = env.getGoogleApiCLientScript()

export const GoogleApiContext = createContext({} as GapiContextType);

export const useGoogleApi = () => {
  return useContext(GoogleApiContext)
}

type GapiContextType = {
  gapi: any
  initGoogleClient: ( updateState: (data:any) => any ) => void
}

export const GoogleApiProvider = ({ children }) => {
    const [gapi, setGapi] = useState(null)
    /**
       *  Initializes the API client library and sets up sign-in state
       *  listeners.
    */
    const getGoogleApi = (ctx={}):void => {
        if(!!ctx && ctx?.hasOwnProperty('gapi')){
            setGapi(ctx['gapi'])
        }
    }
        
    const initGoogleClient = updateState => {
        if(gapi)
            gapi
            .client
            .init({
                apiKey: env.getGoogleApiKey(),
                clientId: env.getinitGoogleClientId(),
                discoveryDocs: env.getGoogleDiscoveryDocs(),
                scope: env.getGoogleScopes(),
            })
            .then(() => {
                // Listen for sign-in state changes.
                gapi.auth2.getAuthInstance().isSignedIn.listen(updateState);
    
                // Handle the initial sign-in state.
                updateState(gapi.auth2.getAuthInstance().isSignedIn.get());
            }, err => console.error(err));
    };

  return (
    <>
        <Script
            src={gapi_src}
            strategy="afterInteractive"
            onLoad={() => getGoogleApi(window)}
        />
        <GoogleApiContext.Provider
            value={{
                gapi,
                initGoogleClient,
            }}
        >
        {children}
        </GoogleApiContext.Provider>
    </>
  )
}