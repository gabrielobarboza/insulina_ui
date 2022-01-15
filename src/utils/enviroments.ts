const env = {
    getGoogleApiKey: () => {
        return process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY
    },
    getinitGoogleClientId: () => {
        return process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID
    },
    getGoogleDiscoveryDocs: () => {
        const docs = []
        docs.push(process.env.NEXT_PUBLIC_GOOGLE_DISCOVERY_DOCS)
        return docs
    },
    getGoogleScopes: () => {
        return process.env.NEXT_PUBLIC_GOOGLE_SCOPES
    }
}

export default env