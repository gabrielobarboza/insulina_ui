// import { ApolloClient, InMemoryCache } from '@apollo/client'
import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client'
import { createUploadLink } from 'apollo-upload-client'
import { useMemo } from 'react'
import { setContext } from '@apollo/client/link/context'
import { config } from 'config'

export let apolloClient

const uploadLink = createUploadLink({
  uri: config.ApiUrl
})

const authLink = setContext((_, { headers }) => {

  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      // ...(token && token !== 'null'
      //   ? { authorization: `Bearer ${token}` }
      //   : {}),
    }
  }
})

function createApolloClient() {
  return new ApolloClient({
    link: ApolloLink.from([authLink, uploadLink]),
    cache: new InMemoryCache({
      addTypename: false,
      typePolicies: {
        Query: {
          fields: {
            // TODO: Definir politicas de cache
          }
        }
      }
    })
  })
}

export const initializeApollo = (initialState = null) => {
  const _apolloClient = apolloClient ?? createApolloClient()

  // If your page has Next.js data fetching methods that use Apollo Client,
  // the initial state gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract()

    // Restore the cache using the data passed from
    // getStaticProps/getServerSideProps combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState })
  }

  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient

  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient
  return _apolloClient
}

export const useApollo = initialState => {
  const store = useMemo(() => initializeApollo(initialState), [initialState])
  return store
}

const client = {
  initializeApollo,
  useApollo
}

export default client
