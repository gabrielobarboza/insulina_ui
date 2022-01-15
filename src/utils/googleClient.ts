import env from './enviroments'

/**
   *  Initializes the API client library and sets up sign-in state
   *  listeners.
*/
export const getGoogleApiClient = ():any => window.hasOwnProperty('gapi') && window['gapi'];

export const initGoogleClient = (updateSigninStatus) => {
    const gapi = getGoogleApiClient();

    gapi?.client
    .init({
    apiKey: env.getGoogleApiKey(),
    clientId: env.getinitGoogleClientId(),
    discoveryDocs: env.getGoogleDiscoveryDocs(),
    scope: env.getGoogleScopes(),
    })
    .then(() => {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    },
    err => console.error(err)
    );
};
export default initGoogleClient
